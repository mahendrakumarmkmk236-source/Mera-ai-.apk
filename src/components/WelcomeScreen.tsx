import React from 'react';
import {
  Music,
  Youtube,
  FileText,
  Globe,
  Sparkles,
  ArrowRight,
  Code2,
  Compass,
  GraduationCap,
  Smartphone,
  Download,
} from 'lucide-react';
import { PersonaKey, LanguagePreference } from '../types.ts';
import { PERSONAS, PROMPT_SUGGESTIONS } from '../constants.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface WelcomeScreenProps {
  currentPersona: PersonaKey;
  onSelectPersona: (p: PersonaKey) => void;
  languagePreference: LanguagePreference;
  onSelectLanguage: (lang: LanguagePreference) => void;
  onSelectPrompt: (prompt: string, personaTarget?: PersonaKey) => void;
  onOpenFutureFeatures: () => void;
  onOpenYouTubeStudio?: () => void;
  onOpenWebBrowsing?: () => void;
  onOpenAndroidGuide?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentPersona,
  onSelectPersona,
  languagePreference,
  onSelectLanguage,
  onSelectPrompt,
  onOpenFutureFeatures,
  onOpenYouTubeStudio,
  onOpenWebBrowsing,
  onOpenAndroidGuide,
}) => {
  const activePersona = PERSONAS[currentPersona] || PERSONAS.general;

  const iconMap: Record<string, React.ReactNode> = {
    Music: <Music className="w-4 h-4 text-purple-400" />,
    Youtube: <Youtube className="w-4 h-4 text-rose-400" />,
    FileText: <FileText className="w-4 h-4 text-amber-400" />,
    Globe: <Globe className="w-4 h-4 text-cyan-400" />,
    Code2: <Code2 className="w-4 h-4 text-blue-400" />,
    Compass: <Compass className="w-4 h-4 text-emerald-400" />,
    GraduationCap: <GraduationCap className="w-4 h-4 text-amber-400" />,
  };

  const featurePillars = [
    {
      title: 'गाने व लिरिक्स',
      desc: 'बॉलीवुड गाने, रैप, ग़ज़लें व भावुक कविताएं',
      icon: <Music className="w-5 h-5 text-purple-400" />,
      target: 'youtube_song' as PersonaKey,
    },
    {
      title: 'YouTube क्रिएटर टूल',
      desc: 'वायरल टाइटल्स, टाइमस्टैम्प्स, SEO विवरण व टैग्स',
      icon: <Youtube className="w-5 h-5 text-rose-400" />,
      target: 'youtube_song' as PersonaKey,
    },
    {
      title: 'फोटो व PDF विश्लेषक',
      desc: 'फ़ोटो, रसीदें या PDF नोट्स अपलोड करके पूछें',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      target: 'document_pdf' as PersonaKey,
    },
    {
      title: 'सुरक्षित वेब सर्च',
      desc: 'गूगल सर्च ग्राउंडिंग से ताज़ा व सटीक जानकारी',
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      target: 'general' as PersonaKey,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-8 md:py-10 flex flex-col items-center justify-start text-slate-100 max-w-4xl mx-auto w-full">
      {/* Brand Hero */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <BrandLogo size="lg" className="mb-4 ring-8 ring-blue-950/40" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-xs text-blue-300 mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Mera AI · आपका अपना कृत्रिम बुद्धिमत्ता साथी</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 max-w-xl text-balance">
          नमस्ते! मैं <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">Mera AI</span> हूँ
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed text-balance">
          हिंदी, Hinglish या English में बात करें। गाने व YouTube स्क्रिप्ट लिखें, फ़ोटो व PDF समझें और सुरक्षित वेब सर्च का लाभ उठाएं।
        </p>

        {/* Language Quick Selector */}
        <div className="flex items-center gap-1 mt-4 p-1 bg-[#081024] border border-blue-950 rounded-xl">
          {[
            { id: 'auto', label: '🔄 ऑटो (Auto)' },
            { id: 'hindi', label: '🇮🇳 हिंदी' },
            { id: 'hinglish', label: '🗣️ Hinglish' },
            { id: 'english', label: '🌐 English' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => onSelectLanguage(lang.id as LanguagePreference)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                languagePreference === lang.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/60'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6 sm:mb-8">
        {featurePillars.map((f, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (f.title.includes('YouTube') && onOpenYouTubeStudio) {
                onOpenYouTubeStudio();
              } else if (f.title.includes('वेब') && onOpenWebBrowsing) {
                onOpenWebBrowsing();
              } else {
                onSelectPersona(f.target);
              }
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#081024]/70 border border-blue-950/70 hover:border-blue-800/80 hover:bg-[#0a1430] transition-all cursor-pointer group flex items-start gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-900/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {f.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                  {f.title}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Android App & Offline AI Ready Banner */}
      {onOpenAndroidGuide && (
        <div
          onClick={onOpenAndroidGuide}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#071324] to-[#0d1f3d] border border-emerald-500/40 hover:border-emerald-400/70 transition-all cursor-pointer shadow-lg group flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Android ऐप और ऑफ़लाइन लोकल AI
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA & APK Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                फोन में 1-क्लिक इंस्टॉल करें, इंटरनेट न होने पर स्थानीय AI से चैट करें, और सुरक्षित API Key का आनंद लें।
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold text-xs shrink-0 group-hover:bg-emerald-500/30 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>गाइड देखें</span>
          </div>
        </div>
      )}

      {/* Suggested Prompts Section */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-slate-300">
            कुछ लोकप्रिय उदाहरण (Click to Try)
          </span>
          <span className="text-[11px] text-slate-400">
            मोड: {activePersona.hindiName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROMPT_SUGGESTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectPrompt(item.prompt, item.personaTarget)}
              className="text-left p-3 rounded-xl bg-[#060c1d] border border-blue-950 hover:border-cyan-500/50 hover:bg-[#09122b] transition-all group flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-950 flex items-center justify-center shrink-0">
                  {iconMap[item.icon] || <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-cyan-300">
                  {item.category}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 line-clamp-2 group-hover:text-white">
                {item.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Informative Security & Future Roadmap banner */}
      <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-900/40 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200">सुरक्षित व निजी:</strong> API Key केवल सर्वर पर सुरक्षित है। आवाज़ व AI इमेज स्टूडियो भी उपलब्ध है।
          </span>
        </div>
        <button
          onClick={onOpenFutureFeatures}
          className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
        >
          आगामी सुविधाएं देखें →
        </button>
      </div>
    </div>
  );
};
