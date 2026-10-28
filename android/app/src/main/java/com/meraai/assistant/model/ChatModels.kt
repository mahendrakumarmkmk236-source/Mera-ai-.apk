package com.meraai.assistant.model

import java.util.UUID

enum class MessageRole {
    USER, ASSISTANT, SYSTEM
}

enum class LanguagePreference(val code: String, val displayName: String) {
    AUTO("auto", "🔄 ऑटो (Auto)"),
    HINDI("hindi", "🇮🇳 हिंदी"),
    HINGLISH("hinglish", "🗣️ Hinglish"),
    ENGLISH("english", "🌐 English")
}

data class WebSource(
    val title: String,
    val uri: String,
    val domain: String = ""
)

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val role: MessageRole,
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isStreaming: Boolean = false,
    val isLocalAi: Boolean = false,
    val sources: List<WebSource> = emptyList(),
    val error: Boolean = false,
    val errorMessage: String? = null
)

data class Persona(
    val id: String,
    val hindiName: String,
    val englishName: String,
    val tagline: String,
    val placeholder: String
)

object Personas {
    val GENERAL = Persona{
        id = "general",
        hindiName = "सर्वज्ञानी (General AI)",
        englishName = "General Assistant",
        tagline = "दैनिक काम, अध्ययन व सामान्य ज्ञान",
        placeholder = "Mera AI से कुछ भी पूछें (हिंदी, Hinglish या English)..."
    }

    val YOUTUBE_SONG = Persona(
        id = "youtube_song",
        hindiName = "गीतकार व यूट्यूबर (Music & Creator)",
        englishName = "Songwriter & YouTube Studio",
        tagline = "गाने, शायरी, वायरल टाइटल्स व स्क्रिप्ट",
        placeholder = "गाने के बोल, YouTube स्क्रिप्ट या टाइटल के लिए लिखें..."
    )

    val DOCUMENT_PDF = Persona(
        id = "document_pdf",
        hindiName = "दस्तावेज़ विश्लेषक (Doc & PDF)",
        englishName = "Document & Photo Analyst",
        tagline = "फ़ोटो, रसीदें व PDF सारांश",
        placeholder = "दस्तावेज़ या नोट्स के बारे में सवाल पूछें..."
    )

    val ALL = listOf(GENERAL, YOUTUBE_SONG, DOCUMENT_PDF)
}

private fun Persona(
    id: String,
    hindiName: String,
    englishName: String,
    tagline: String,
    placeholder: String
): Persona = Persona(id, hindiName, englishName, tagline, placeholder)
