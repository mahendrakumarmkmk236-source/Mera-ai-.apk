import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Terminal,
  Layers,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  WifiOff,
  Cpu,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface AndroidAppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppGuideModal: React.FC<AndroidAppGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'kotlin' | 'pwa' | 'twa' | 'capacitor'>('kotlin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-23c7jbhugrckg5qmerwuol-381203122518.asia-east1.run.app';

  const manifestUrl = `${currentOrigin}/manifest.webmanifest`;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const kotlinCommands = `# 1. Android प्रोजेक्ट डायरेक्टरी में जाएँ
cd android

# 2. Motorola G96 5G (Android 14/15) के लिए Debug APK बिल्ड करें
./gradlew assembleDebug

# 3. APK फ़ाइल का स्थान:
# android/app/build/outputs/apk/debug/app-debug.apk

# 4. ADB द्वारा सीधे अपने Motorola G96 5G फोन में इंस्टॉल करें:
adb install -r app/build/outputs/apk/debug/app-debug.apk`;

  const bubblewrapCommands = `# 1. Google का आधिकारिक Bubblewrap CLI इंस्टॉल करें
npm install -g @bubblewrap/cli

# 2. Mera AI का PWA मेनिफेस्ट लिंक देकर Android प्रोजेक्ट तैयार करें
bubblewrap init --manifest ${manifestUrl}

# 3. साइन्ड Android APK तैयार करें
bubblewrap build

# तैयार फ़ाइल: app-release-signed.apk (सीधे फोन में इंस्टॉल करें!)`;

  const capacitorCommands = `# 1. Capacitor कोर और Android पैकेज इंस्टॉल करें
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. प्रोजेक्ट इनिशियलाइज़ करें
npx cap init "Mera AI" "com.meraai.assistant" --web-dir dist

# 3. ऐप बिल्ड करें
npm run build

# 4. Android प्लेटफ़ॉर्म जोड़ें
npx cap add android
npx cap sync android

# 5. Android Studio में खोलें और APK बनाएँ
npx cap open android
# (Android Studio में: Build > Build Bundle(s) / APK(s) > Build APK)`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#070d1e] border border-blue-900/60 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-blue-950/80 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#070d1e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Android ऐप कनवर्टर व गाइड</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  APK & PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mera AI को अपने Android फोन पर नेटिव ऐप की तरह चलाने के 3 आसान तरीके
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-blue-950/80 bg-[#050a18] px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('kotlin')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'kotlin'
                ? 'border-cyan-500 text-cyan-300 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>नेटिव Kotlin + Compose (Motorola G96 5G)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'pwa'
                ? 'border-emerald-500 text-emerald-300 bg-blue-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1-क्लिक PWA (तुरंत फोन में)</span>
          </button>

          <button
            onClick={() => setActiveTab('twa')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'twa'
                ? 'border-blue-500 text-cyan-300 bg-blue-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Bubblewrap (Play Store APK)</span>
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'capacitor'
                ? 'border-purple-500 text-purple-300 bg-blue-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capacitor Studio</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed">
          {activeTab === 'kotlin' && (
            <div className="space-y-4">
              {/* Highlight Card for Motorola G96 5G */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/70 via-[#071324] to-[#0a1e38] border border-cyan-500/40 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Motorola G96 5G के लिए पूर्णतः अनुकूलित
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        120Hz Jetpack Compose
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      प्रोजेक्ट में <code>android/</code> फ़ोल्डर के अंदर संपूर्ण Kotlin, Material 3 और Compose कोड तैयार कर दिया गया है।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-900/40 text-[11px]">
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-slate-400 block">टारगेट OS:</span>
                    <strong className="text-white">Android 14 / 15</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-slate-400 block">UI टूलकिट:</span>
                    <strong className="text-cyan-300">Jetpack Compose</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-slate-400 block">प्रोसेसर ABI:</span>
                    <strong className="text-emerald-300">arm64-v8a</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-slate-400 block">लोकल AI:</span>
                    <strong className="text-amber-300">On-Device Engine</strong>
                  </div>
                </div>
              </div>

              {/* Direct 1-Click ZIP Download Button */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-[#061426] to-[#0a1e38] border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <h5 className="font-bold text-white text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Mera AI Android प्रोजेक्ट (.zip) डाउनलोड करें
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    पूरा Kotlin + Jetpack Compose सोर्स कोड, Gradle स्क्रिप्ट्स व रिसोर्सेज एक क्लिक में पाएँ।
                  </p>
                </div>
                <a
                  href="/api/download/android-project.zip"
                  download="MeraAI-Android-Motorola-G96.zip"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>.ZIP डाउनलोड करें</span>
                </a>
              </div>

              {/* Step by Step Build & Install on Motorola G96 5G */}
              <div className="p-4 rounded-xl bg-[#091126] border border-blue-900/40 space-y-3">
                <h5 className="font-semibold text-slate-200 text-sm">
                  🚀 APK बिल्ड करने और Motorola G96 5G पर इंस्टॉल करने का तरीका:
                </h5>

                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>
                    <strong>Android Studio में प्रोजेक्ट खोलें:</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Android Studio खोलें और <code>Open Project</code> करके इस रिपोजिटरी का <code>android/</code> फ़ोल्डर चुनें।
                    </p>
                  </li>
                  <li>
                    <strong>APK बिल्ड करें:</strong>
                    <div className="my-1.5 p-2 bg-[#040816] rounded-lg border border-blue-950 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                      <span>cd android &amp;&amp; ./gradlew assembleDebug</span>
                      <button
                        onClick={() => copyCode(kotlinCommands, 'kcmd')}
                        className="text-slate-400 hover:text-white ml-2 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'kcmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">कॉपी</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      APK फ़ाइल तैयार होगी: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>
                    </p>
                  </li>
                  <li>
                    <strong>Motorola G96 5G में सीधे इंस्टॉल करें (Direct APK):</strong>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      इस <code>app-debug.apk</code> फ़ाइल को <strong>WhatsApp</strong>, <strong>Google Drive</strong>, या <strong>USB केबल</strong> द्वारा अपने Motorola G96 5G फोन में भेजें।
                    </p>
                  </li>
                  <li>
                    <strong>अज्ञात स्रोत अनुमति (Unknown Apps):</strong>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      फ़ोन में APK पर टैप करें। यदि फ़ोन पूछे <em>"Install unknown apps"</em>, तो <strong>Settings ➔ Allow from this source</strong> चालू करें और <strong>"Install"</strong> दबाएँ!
                    </p>
                  </li>
                </ol>
              </div>

              {/* Ready Project Structure */}
              <div className="p-3 bg-black/40 rounded-xl border border-blue-950 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-cyan-400 font-semibold mb-1">📁 निर्मित Android Jetpack Compose फ़ाइलें:</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/MainActivity.kt</code> (Compose Activity)</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/ui/screens/MeraAiMainScreen.kt</code> (UI &amp; Feed)</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/ui/components/ChatComponents.kt</code> (Send Button &amp; Items)</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/data/LocalAiEngine.kt</code> (On-Device Offline AI)</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/data/MeraAiRepository.kt</code> (Gemini &amp; Network)</div>
                <div>• <code>android/app/src/main/java/com/meraai/assistant/viewmodel/MeraAiViewModel.kt</code> (State &amp; Flow)</div>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* Direct Install Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 via-[#071324] to-[#0a1b33] border border-emerald-500/40 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      सीधे फोन की होम स्क्रीन पर इंस्टॉल करें
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      बिना किसी Android Studio या कोडिंग के, यह ऐप आपके फोन में असली Android ऐप की तरह
                      पूर्ण स्क्रीन (Full Screen, No URL bar) में खुलती है।
                    </p>
                  </div>

                  {isInstalled ? (
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 shrink-0">
                      <Check className="w-4 h-4" />
                      <span>इंस्टॉल्ड है!</span>
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={install}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>अभी इंस्टॉल करें</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-black/40 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
                      {isIOS ? 'Safari: Share ➔ Add to Home Screen' : 'Chrome: ⋮ मेनू ➔ Install App'}
                    </div>
                  )}
                </div>
              </div>

              {/* Step by Step Android PWA Guide */}
              <div className="p-4 rounded-xl bg-[#091126] border border-blue-900/40 space-y-3">
                <h5 className="font-semibold text-slate-200 text-sm">
                  📱 Android Chrome में मैनुअल इंस्टॉल करने का तरीका:
                </h5>
                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>
                    अपने Android फोन के <strong>Google Chrome</strong> या <strong>Samsung Internet</strong> ब्राउज़र में यह लिंक खोलें:
                    <div className="my-1.5 p-2 bg-[#040816] rounded-lg border border-blue-950 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                      <span className="truncate">{currentOrigin}</span>
                      <button
                        onClick={() => copyCode(currentOrigin, 'url')}
                        className="text-slate-400 hover:text-white ml-2 flex items-center gap-1"
                      >
                        {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                  <li>ऊपर दाईं ओर <strong>तीन बिंदुओं (⋮ मेनू)</strong> पर टैप करें।</li>
                  <li>
                    <strong>"Install app"</strong> या <strong>"होम स्क्रीन पर जोड़ें (Add to Home screen)"</strong> चुनें।
                  </li>
                  <li>
                    <strong>"Install"</strong> दबाएँ — 5 सेकंड में आपके फोन के ऐप ड्रॉअर और होम स्क्रीन पर <strong>Mera AI</strong> का ऑफिशियल लोगो वाला ऐप आ जाएगा।
                  </li>
                </ol>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/30">
                  <div className="text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5" />
                    ऑफ़लाइन सक्षम
                  </div>
                  <p className="text-[11px] text-slate-400">
                    इंटरनेट न होने पर भी लोकल AI मॉडल और कैश किए गए चैट्स तुरंत खुलते हैं।
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/30">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    सुरक्षित API Key
                  </div>
                  <p className="text-[11px] text-slate-400">
                    आपकी Gemini API Key सर्वर पर गुप्त रहती है; फोन में कभी स्टोर नहीं होती।
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/30">
                  <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    लाइटवेट व तेज़
                  </div>
                  <p className="text-[11px] text-slate-400">
                    केवल 2 MB से कम स्पेस लेता है और बिना बैटरी ड्रेन के अत्यंत स्मूथ चलता है।
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'twa' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-300">
                <p>
                  <strong>Google Bubblewrap</strong> गूगल का आधिकारिक CLI टूल है जो किसी भी PWA को 5 मिनट में
                  <strong> Google Play Store-ready Android APK / AAB</strong> में बदल देता है।
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">Terminal Commands:</span>
                  <button
                    onClick={() => copyCode(bubblewrapCommands, 'twa')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'twa' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>कॉपी हो गया</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>कमांड्स कॉपी करें</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#030612] border border-blue-950 text-cyan-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {bubblewrapCommands}
                </pre>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>टिप:</strong> Bubblewrap से बनी APK को आप USB केबल या WhatsApp से अपने फोन में भेजकर सीधे इंस्टॉल कर सकते हैं, या Google Play Console पर अपलोड कर सकते हैं।
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-slate-300">
                <p>
                  <strong>Capacitor</strong> द्वारा आप पूरे Mera AI React फ्रंटएंड को असली Native Java/Kotlin Android Studio प्रोजेक्ट में बदल सकते हैं, जिससे आपको ब्लूटूथ, कैमरा, और बैकग्राउंड सर्विस की पूरी नेटिव छूट मिलती है।
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">Capacitor Setup Commands:</span>
                  <button
                    onClick={() => copyCode(capacitorCommands, 'cap')}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {copiedKey === 'cap' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>कॉपी हो गया</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>कमांड्स कॉपी करें</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#030612] border border-blue-950 text-purple-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {capacitorCommands}
                </pre>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                📱 <strong>Android Studio में APK पाना:</strong> कमांड चलाने के बाद Android Studio खुलेगा, जहाँ मेन्यू में <code>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code> दबाने पर <code>app-debug.apk</code> तुरंत तैयार हो जाएगी।
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-950/80 bg-[#040816] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mera AI v1.0 Android Compatible</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-cyan-200 border border-blue-500/40 text-xs font-semibold transition-colors"
          >
            समझ गया (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
