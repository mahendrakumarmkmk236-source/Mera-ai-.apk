import React from 'react';
import { X, Mic, Image as ImageIcon, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, ExternalLink, Volume2 } from 'lucide-react';

interface FutureFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FutureFeaturesModal: React.FC<FutureFeaturesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl bg-[#081024] border border-blue-900/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-blue-950 flex items-center justify-between bg-[#040814]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">सुविधाएं व तकनीकी रोडमैप (Features Roadmap)</h2>
              <p className="text-xs text-slate-400">आवाज़, AI इमेज, सुरक्षित API व भुगतान संबंधी विवरण</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-blue-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm text-slate-300">
          {/* Section 1: Voice Capabilities */}
          <div className="p-4 rounded-xl bg-[#050b1a] border border-blue-950 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-100">1. आवाज़ सुविधाएँ (Voice Features)</h3>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                सक्रिय (Active v1)
              </span>
            </div>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>माइक्रोफ़ोन टाइपिंग:</strong> ब्राउज़र Web Speech API द्वारा हिंदी व अंग्रेज़ी में बोलकर संदेश टाइप करना पूरी तरह मुफ़्त व चालू है।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>आवाज़ में सुनना (TTS):</strong> प्रत्येक AI उत्तर के नीचे "सुनें" बटन द्वारा प्राकृतिक स्वर में सुनना सक्रिय है।</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>भविष्य का अपग्रेड (Gemini Live Duplex):</strong> निरंतर लाइव दोतरफ़ा बातचीत के लिए WebSocket Live API (gemini-3.8-live) जोड़ने का ढाँचा तैयार है। इसके लिए Google Cloud बिलिंग व सशुल्क टोकन की आवश्यकता होगी।</span>
              </li>
            </ul>
          </div>

          {/* Section 2: AI Image Generation & Vision */}
          <div className="p-4 rounded-xl bg-[#050b1a] border border-blue-950 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-slate-100">2. फोटो व AI इमेज सुविधाएँ (Vision & Image Studio)</h3>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                विज़न चालू (Vision Live)
              </span>
            </div>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>फोटो व PDF समझना:</strong> आप किसी भी फ़ोटो या PDF को अपलोड करके सवाल पूछ सकते हैं। यह Gemini 3.8 Flash पर 100% काम कर रहा है।</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>टेक्स्ट से नई AI फोटो जनरेट करना (Text-to-Image Generation):</strong> Gemini के इमेज जेनरेशन मॉडल (<code className="text-cyan-300">gemini-3.1-flash-lite-image</code> व <code className="text-cyan-300">gemini-nano-banana-2.1</code>) के लिए <strong>Paid API Key (Google Cloud Project Billing)</strong> अनिवार्य होती है। जब आप अपना सशुल्क खाता जोड़ेंगे, तो यह सुविधा सीधे सक्रिय हो जाएगी।
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: API Security & Server Architecture */}
          <div className="p-4 rounded-xl bg-[#050b1a] border border-blue-950 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-100">3. सुरक्षा व शून्य लीक गारंटी (Zero Secret Leak)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mera AI में आपकी सुरक्षा सर्वोच्च प्राथमिकता है:
            </p>
            <ul className="text-xs space-y-1 text-slate-400 list-disc list-inside">
              <li>API Key कभी भी फ्रंटएंड या ब्राउज़र कोड में नहीं डाली जाती।</li>
              <li>सभी रिक्वेस्ट सुरक्षित Express प्रॉक्सी सर्वर (<code className="text-amber-300">/api/chat/stream</code>) से होकर गुजरती हैं।</li>
              <li>चैट हिस्ट्री आपके अपने ब्राउज़र के LocalStorage में सुरक्षित रहती है।</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-950 bg-[#040814]/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            समझ गया, चैट जारी रखें
          </button>
        </div>
      </div>
    </div>
  );
};
