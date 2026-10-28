# Mera AI - Native Android App (Kotlin & Jetpack Compose)

This is the native Android project for **Mera AI**, built with **Kotlin 2.1**, **Jetpack Compose (Material 3)**, and optimized for modern Android 14/15 5G smartphones such as the **Motorola G96 5G**.

## Features Preserved:
- 🇮🇳 **Hindi & Hinglish Support**: Native Devanagari typography, natural conversational tones.
- 💬 **Touch-Friendly Send Button**: Prominent "भेजें" button with smooth feedback.
- ⚡ **Offline Local AI Engine**: Runs 100% locally on the device when disconnected.
- 🌐 **Online Gemini 3.1 Flash**: Ultra-fast responses with Google Search citations.
- 📱 **Motorola G96 5G Optimized**: 120Hz smooth scrolling, adaptive edge-to-edge layout, battery-efficient coroutines.
- 📤 **1-Tap WhatsApp Share**: Direct Android intent to share AI summaries with friends.

---

## 🛠️ How to Build and Install on Motorola G96 5G

### Step 1: Open in Android Studio
1. Open **Android Studio** (Koala / Ladybug or newer with JDK 17+).
2. Choose **Open an Existing Project** and select the `android` folder.
3. Allow Gradle to sync dependencies automatically.

### Step 2: Build the APK
- In the top menu, click:  
  **`Build > Build Bundle(s) / APK(s) > Build APK(s)`**
- Once finished, click **"locate"** in the notification.  
  Your APK file will be at:
  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

### Step 3: Install on your Motorola G96 5G

#### Method A: Direct File Transfer (Easiest)
1. Send the `app-debug.apk` file to your Motorola G96 5G via **WhatsApp**, **Google Drive**, **Telegram**, or **USB Cable**.
2. On your Motorola G96 5G, tap the `.apk` file.
3. If prompted: **"Install unknown apps"**, tap **Settings** and toggle **"Allow from this source"** ON.
4. Tap **"Install"** — Mera AI is now installed on your Motorola G96 5G!

#### Method B: USB Debugging via ADB
1. On your Motorola G96 5G, enable Developer Options:  
   *Go to `Settings > About phone` > tap `Build number` 7 times.*
2. In `Settings > System > Developer options`, turn on **USB debugging**.
3. Connect your Motorola G96 5G to your computer using a USB-C cable.
4. In Android Studio or terminal, run:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. The app launches immediately!
