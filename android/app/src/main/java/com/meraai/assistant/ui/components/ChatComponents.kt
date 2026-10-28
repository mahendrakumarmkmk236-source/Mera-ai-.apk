package com.meraai.assistant.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meraai.assistant.model.ChatMessage
import com.meraai.assistant.model.MessageRole
import com.meraai.assistant.model.Persona
import com.meraai.assistant.model.Personas
import com.meraai.assistant.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeraAiTopBar(
    currentPersona: Persona,
    isOnline: Boolean,
    onSelectPersona: (Persona) -> Unit,
    onClearChat: () -> Unit
) {
    var personaMenuExpanded by remember { mutableStateOf(false) }

    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = SurfaceDark
        ),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Branded logo orb
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            Brush.linearGradient(listOf(PrimaryBlue, PrimaryIndigo))
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text("M", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Mera AI",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        // Online / Offline Status Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isOnline) AccentEmerald.copy(alpha = 0.2f)
                                    else AccentAmber.copy(alpha = 0.2f)
                                )
                                .border(
                                    1.dp,
                                    if (isOnline) AccentEmerald.copy(alpha = 0.5f)
                                    else AccentAmber.copy(alpha = 0.5f),
                                    RoundedCornerShape(12.dp)
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = if (isOnline) "🟢 ऑनलाइन" else "🟠 ऑफ़लाइन AI",
                                fontSize = 10.sp,
                                color = if (isOnline) AccentEmerald else AccentAmber,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                    Text(
                        text = currentPersona.hindiName,
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }
            }
        },
        actions = {
            // Persona dropdown trigger
            IconButton(onClick = { personaMenuExpanded = true }) {
                Icon(
                    imageVector = Icons.Default.Tune,
                    contentDescription = "मोड बदलें",
                    tint = AccentCyan
                )
            }
            DropdownMenu(
                expanded = personaMenuExpanded,
                onDismissRequest = { personaMenuExpanded = false },
                modifier = Modifier.background(SurfaceCard)
            ) {
                Personas.ALL.forEach { p ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(p.hindiName, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text(p.tagline, color = TextSecondary, fontSize = 11.sp)
                            }
                        },
                        onClick = {
                            onSelectPersona(p)
                            personaMenuExpanded = false
                        }
                    )
                }
            }

            IconButton(onClick = onClearChat) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "चैट साफ़ करें",
                    tint = TextSecondary
                )
            }
        }
    )
}

@Composable
fun ChatMessageItem(
    message: ChatMessage,
    onShareToWhatsApp: (String) -> Unit
) {
    val isUser = message.role == MessageRole.USER
    val context = LocalContext.current
    val timeStr = remember(message.timestamp) {
        SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(message.timestamp))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        // Label & time
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.padding(bottom = 2.dp)
        ) {
            Text(
                text = if (isUser) "आप" else "Mera AI",
                color = TextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
            Text("·", color = TextMuted, fontSize = 11.sp)
            Text(text = timeStr, color = TextMuted, fontSize = 11.sp)

            if (!isUser && message.isLocalAi) {
                Text("·", color = TextMuted, fontSize = 11.sp)
                Text("⚡ स्थानीय AI", color = AccentAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Bubble
        Box(
            modifier = Modifier
                .widthIn(max = 320.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .background(if (isUser) UserBubble else AssistantBubble)
                .border(
                    1.dp,
                    if (isUser) UserBubbleBorder else AssistantBubbleBorder,
                    RoundedCornerShape(16.dp)
                )
                .padding(12.dp)
        ) {
            if (message.isStreaming && message.content.isEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = AccentCyan,
                        strokeWidth = 2.dp
                    )
                    Text("Mera AI सोच रहा है...", color = AccentCyan, fontSize = 12.sp)
                }
            } else {
                Text(
                    text = message.content,
                    color = TextPrimary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }
        }

        // Action buttons under assistant message
        if (!isUser && !message.isStreaming && message.content.isNotBlank()) {
            Row(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Copy
                Text(
                    text = "कॉपी करें",
                    color = AccentCyan,
                    fontSize = 11.sp,
                    modifier = Modifier
                        .clickable {
                            val clipboard =
                                context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("Mera AI", message.content))
                            Toast.makeText(context, "कॉपी किया गया!", Toast.LENGTH_SHORT).show()
                        }
                        .padding(2.dp)
                )

                // WhatsApp share
                Text(
                    text = "WhatsApp शेयर",
                    color = AccentEmerald,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable {
                            onShareToWhatsApp(message.content)
                        }
                        .padding(2.dp)
                )
            }
        }
    }
}

@Composable
fun ChatInputBar(
    input: String,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    isStreaming: Boolean,
    enableWebSearch: Boolean,
    onToggleWebSearch: () -> Unit,
    isOnline: Boolean,
    placeholder: String
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        // Offline notice if disconnected
        if (!isOnline) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(AccentAmber.copy(alpha = 0.15f))
                    .border(1.dp, AccentAmber.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "⚡ ऑफ़लाइन मोड: स्थानीय AI सक्रिय है — बिना इंटरनेट के भी चैट करें।",
                    fontSize = 11.sp,
                    color = AccentAmber
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(SurfaceCard)
                .border(1.dp, BorderAccent, RoundedCornerShape(24.dp))
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            // Web Search toggle
            IconButton(
                onClick = onToggleWebSearch,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Language,
                    contentDescription = "वेब सर्च",
                    tint = if (enableWebSearch) AccentCyan else TextMuted
                )
            }

            // Input TextField
            TextField(
                value = input,
                onValueChange = onInputChange,
                placeholder = {
                    Text(
                        placeholder,
                        color = TextMuted,
                        fontSize = 13.sp,
                        maxLines = 1
                    )
                },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                ),
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 40.dp, max = 120.dp)
            )

            // Prominent Send Button (टच-फ्रेंडली "भेजें" बटन)
            Button(
                onClick = onSend,
                enabled = input.isNotBlank() && !isStreaming,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryBlue,
                    disabledContainerColor = Color(0xFF1E293B)
                ),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                modifier = Modifier.height(38.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "भेजें",
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("भेजें", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
