package com.meraai.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.meraai.assistant.ui.screens.MeraAiMainScreen
import com.meraai.assistant.ui.theme.MeraAITheme
import com.meraai.assistant.viewmodel.MeraAiViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MeraAiViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MeraAITheme {
                MeraAiMainScreen(viewModel = viewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.checkNetworkStatus()
    }
}
