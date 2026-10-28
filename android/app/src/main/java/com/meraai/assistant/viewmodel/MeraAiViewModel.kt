package com.meraai.assistant.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.meraai.assistant.data.MeraAiRepository
import com.meraai.assistant.model.ChatMessage
import com.meraai.assistant.model.LanguagePreference
import com.meraai.assistant.model.MessageRole
import com.meraai.assistant.model.Persona
import com.meraai.assistant.model.Personas
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class MeraAiViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MeraAiRepository(application.applicationContext)

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()

    private val _isOnline = MutableStateFlow(repository.isNetworkAvailable())
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _selectedPersona = MutableStateFlow(Personas.GENERAL)
    val selectedPersona: StateFlow<Persona> = _selectedPersona.asStateFlow()

    private val _languagePreference = MutableStateFlow(LanguagePreference.AUTO)
    val languagePreference: StateFlow<LanguagePreference> = _languagePreference.asStateFlow()

    private val _enableWebSearch = MutableStateFlow(false)
    val enableWebSearch: StateFlow<Boolean> = _enableWebSearch.asStateFlow()

    fun updateInputText(newText: String) {
        _inputText.value = newText
    }

    fun selectPersona(persona: Persona) {
        _selectedPersona.value = persona
    }

    fun setLanguage(lang: LanguagePreference) {
        _languagePreference.value = lang
    }

    fun toggleWebSearch() {
        _enableWebSearch.value = !_enableWebSearch.value
    }

    fun checkNetworkStatus() {
        _isOnline.value = repository.isNetworkAvailable()
    }

    fun clearChat() {
        _messages.value = emptyList()
    }

    fun sendMessage(overridePrompt: String? = null) {
        val prompt = overridePrompt ?: _inputText.value.trim()
        if (prompt.isBlank() || _isStreaming.value) return

        if (overridePrompt == null) {
            _inputText.value = ""
        }

        checkNetworkStatus()
        val currentIsOnline = _isOnline.value

        val userMessage = ChatMessage(
            role = MessageRole.USER,
            content = prompt
        )

        val assistantMessageId = UUID.randomUUID().toString()
        val initialAssistantMessage = ChatMessage(
            id = assistantMessageId,
            role = MessageRole.ASSISTANT,
            content = "",
            isStreaming = true,
            isLocalAi = !currentIsOnline
        )

        _messages.value = _messages.value + userMessage + initialAssistantMessage
        _isStreaming.value = true

        viewModelScope.launch {
            try {
                val (resultText, sources) = repository.sendMessage(
                    userPrompt = prompt,
                    history = _messages.value.dropLast(1),
                    personaId = _selectedPersona.value.id,
                    languagePreference = _languagePreference.value,
                    enableWebSearch = _enableWebSearch.value
                ) { streamingChunk ->
                    _messages.value = _messages.value.map { msg ->
                        if (msg.id == assistantMessageId) {
                            msg.copy(content = streamingChunk, isStreaming = true)
                        } else msg
                    }
                }

                _messages.value = _messages.value.map { msg ->
                    if (msg.id == assistantMessageId) {
                        msg.copy(
                            content = resultText,
                            sources = sources,
                            isStreaming = false,
                            isLocalAi = !currentIsOnline
                        )
                    } else msg
                }
            } catch (e: Exception) {
                _messages.value = _messages.value.map { msg ->
                    if (msg.id == assistantMessageId) {
                        msg.copy(
                            content = "त्रुटि: ${e.localizedMessage ?: "अनुरोध पूरा नहीं हो सका"}",
                            error = true,
                            isStreaming = false
                        )
                    } else msg
                }
            } finally {
                _isStreaming.value = false
            }
        }
    }
}
