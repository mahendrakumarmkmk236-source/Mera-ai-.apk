package com.meraai.assistant.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.meraai.assistant.model.ChatMessage
import com.meraai.assistant.model.LanguagePreference
import com.meraai.assistant.model.MessageRole
import com.meraai.assistant.model.WebSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MeraAiRepository(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .build()

    // Default backend server URL for Mera AI
    var serverBaseUrl: String = "https://ais-dev-23c7jbhugrckg5qmerwuol-381203122518.asia-east1.run.app"

    fun isNetworkAvailable(): Boolean {
        val connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    suspend fun sendMessage(
        userPrompt: String,
        history: List<ChatMessage>,
        personaId: String,
        languagePreference: LanguagePreference,
        enableWebSearch: Boolean,
        onStreamingChunk: suspend (String) -> Unit
    ): Pair<String, List<WebSource>> = withContext(Dispatchers.IO) {
        // If offline, use the local on-device AI engine immediately
        if (!isNetworkAvailable()) {
            val localText = LocalAiEngine.generateResponse(userPrompt, languagePreference) { chunk ->
                onStreamingChunk(chunk)
            }
            return@withContext Pair(localText, emptyList())
        }

        try {
            val jsonBody = JSONObject().apply {
                put("persona", personaId)
                put("languagePreference", languagePreference.code)
                put("enableWebSearch", enableWebSearch)

                val messagesArray = JSONArray()
                // Take last 8 messages for context
                history.takeLast(8).forEach { msg ->
                    messagesArray.put(JSONObject().apply {
                        put("role", if (msg.role == MessageRole.USER) "user" else "assistant")
                        put("content", msg.content)
                    })
                }
                // Add current prompt
                messagesArray.put(JSONObject().apply {
                    put("role", "user")
                    put("content", userPrompt)
                })
                put("messages", messagesArray)
            }

            val request = Request.Builder()
                .url("$serverBaseUrl/api/chat")
                .post(jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                // Network HTTP failure, fallback to local AI
                val fallbackText = LocalAiEngine.generateResponse(userPrompt, languagePreference) { chunk ->
                    onStreamingChunk(chunk)
                }
                return@withContext Pair(fallbackText, emptyList())
            }

            val responseBody = response.body?.string() ?: ""
            val jsonResponse = JSONObject(responseBody)
            val fullText = jsonResponse.optString("text", "कोई उत्तर प्राप्त नहीं हुआ।")

            val sources = mutableListOf<WebSource>()
            val sourcesArray = jsonResponse.optJSONArray("sources")
            if (sourcesArray != null) {
                for (i in 0 until sourcesArray.length()) {
                    val s = sourcesArray.getJSONObject(i)
                    sources.add(
                        WebSource(
                            title = s.optString("title", "वेबसाइट"),
                            uri = s.optString("uri", ""),
                            domain = s.optString("domain", "")
                        )
                    )
                }
            }

            onStreamingChunk(fullText)
            Pair(fullText, sources)
        } catch (e: Exception) {
            // Any network/SSL error -> fallback to on-device engine
            val fallback = LocalAiEngine.generateResponse(userPrompt, languagePreference) { chunk ->
                onStreamingChunk(chunk)
            }
            Pair(fallback, emptyList())
        }
    }
}
