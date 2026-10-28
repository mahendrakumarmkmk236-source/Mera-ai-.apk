package com.meraai.assistant.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meraai.assistant.ui.components.ChatInputBar
import com.meraai.assistant.ui.components.ChatMessageItem
import com.meraai.assistant.ui.components.MeraAiTopBar
import com.meraai.assistant.ui.theme.*
import com.meraai.assistant.viewmodel.MeraAiViewModel

@Composable
fun MeraAiMainScreen(viewModel: MeraAiViewModel) {
    val messages by viewModel.messages.collectAsState()
    val inputText by viewModel.inputText.collectAsState()
    val isStreaming by viewModel.isStreaming.collectAsState()
    val isOnline by viewModel.isOnline.collectAsState()
    val selectedPersona by viewModel.selectedPersona.collectAsState()
    val enableWebSearch by viewModel.enableWebSearch.collectAsState()

    val context = LocalContext.current
    val listState = rememberLazyListState()

    // Auto-scroll when new messages arrive
    LaunchedEffect(messages.size, isStreaming) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    val shareToWhatsApp: (String) -> Unit = { text ->
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "*Mera AI Assistant:*\n\n$text")
            setPackage("com.whatsapp")
        }
        try {
            context.startActivity(intent)
        } catch (e: Exception) {
            // If WhatsApp package direct intent fails, open system chooser
            val chooser = Intent.createChooser(
                Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "*Mera AI Assistant:*\n\n$text")
                },
                "साझा करें"
            )
            context.startActivity(chooser)
        }
    }

    Scaffold(
        topBar = {
            MeraAiTopBar(
                currentPersona = selectedPersona,
                isOnline = isOnline,
                onSelectPersona = { viewModel.selectPersona(it) },
                onClearChat = { viewModel.clearChat() }
            )
        },
        bottomBar = {
            ChatInputBar(
                input = inputText,
                onInputChange = { viewModel.updateInputText(it) },
                onSend = { viewModel.sendMessage() },
                isStreaming = isStreaming,
                enableWebSearch = enableWebSearch,
                onToggleWebSearch = { viewModel.toggleWebSearch() },
                isOnline = isOnline,
                placeholder = selectedPersona.placeholder
            )
        },
        containerColor = BgDark
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(BgDark)
        ) {
            if (messages.isEmpty()) {
                // Empty state / Welcome Screen
                WelcomeContent(
                    personaTagline = selectedPersona.tagline,
                    onPromptClick = { prompt ->
                        viewModel.sendMessage(prompt)
                    }
                )
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(messages, key = { it.id }) { message ->
                        ChatMessageItem(
                            message = message,
                            onShareToWhatsApp = shareToWhatsApp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WelcomeContent(
    personaTagline: String,
    onPromptClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "नमस्ते! मैं Mera AI हूँ",
            color = TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = personaTagline,
            color = TextSecondary,
            fontSize = 13.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "लोकप्रिय उदाहरण (टैप करें):",
            color = TextMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.align(Alignment.Start)
        )

        Spacer(modifier = Modifier.height(8.dp))

        val samplePrompts = listOf(
            "एक प्रेरक हिंदी कविता या शायरी लिखो" to Icons.Default.MusicNote,
            "यूट्यूब वीडियो के लिए 5 वायरल टाइटल्स बताओ" to Icons.Default.VideoLibrary,
            "Motorola G96 5G की बैटरी लाइफ बढ़ाने के 5 टिप्स" to Icons.Default.AutoAwesome,
            "Python या Kotlin में बेसिक कैलकुलेटर का कोड" to Icons.Default.Translate
        )

        samplePrompts.forEach { (prompt, icon) ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(SurfaceCard)
                    .clickable { onPromptClick(prompt) }
                    .padding(12.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = AccentCyan,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = prompt,
                    color = TextPrimary,
                    fontSize = 13.sp
                )
            }
        }
    }
}
