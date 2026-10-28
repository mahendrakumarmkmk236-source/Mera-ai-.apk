import React from 'react';
import {
  Menu,
  Plus,
  Settings,
  Sparkles,
  ChevronDown,
  Download,
  Youtube,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { PersonaKey, LanguagePreference } from '../types.ts';
import { PERSONAS } from '../constants.ts';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';

interface HeaderProps {
  currentPersona: PersonaKey;
  onSelectPersona: (p: PersonaKey) => void;
  languagePreference: LanguagePreference;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onExportTxt?: () => void;
  onOpenYouTubeStudio?: () => void;
  onOpenWhatsAppShare?: () => void;
  onOpenWebBrowsing?: () => void;
  onOpenAndroidGuide?: () => void;
  isOnline?: boolean;
  canExport?: boolean;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersona,
  onSelectPersona,
  languagePreference,
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onExportTxt,
  onOpenYouTubeStudio,
  onOpenWhatsAppShare,
  onOpenWebBrowsing,
  onOpenAndroidGuide,
  isOnline = true,
  canExport = false,
}) => {
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = React.useState(false);
  const activePersona = PERSONAS[currentPersona] || PERSONAS.general;

  const languageLabels: Record<LanguagePreference, string> = {
    auto: 'ऑटो',
    hindi: 'हिंदी',
    hinglish: 'Hinglish',
    english: 'English',
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-slate-950/90 backdrop-blur-md border-b border-blue-950/80 px-3 md:px-6 flex items-center justify-between gap-2 md:gap-8">
      {/* Zone 1: Brand & Sidebar Trigger */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          title="बातचीत सूची (Chat History)"
          aria-label="Toggle chat history"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNewChat();
          }}
          className="flex items-center gap-2.5 text-slate-100 group focus-visible:outline-none"
        >
          <BrandLogo size="sm" />
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Mera AI
            </span>
          </div>
        </a>

        {/* Quiet divider */}
        <span className="hidden sm:inline-block text-slate-700 select-none">/</span>

        {/* Active persona indicator badge (Clickable dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="साथी का मोड बदलें"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[110px] sm:max-w-[160px] truncate">
              {activePersona.hindiName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isPersonaMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPersonaMenuOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  AI साथी का मोड चुनें (Persona)
                </div>
                {Object.values(PERSONAS).map((p) => {
                  const isSelected = p.id === currentPersona;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPersona(p.id);
                        setIsPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        isSelected ? 'bg-slate-800/80 text-amber-400 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-100">{p.hindiName}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{p.tagline}</div>
                      </div>
                      {isSelected && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Language state & Connection indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
          }`}
          title={isOnline ? 'इंटरनेट कनेक्टेड - ऑनलाइन Gemini 3.1 Flash' : 'इंटरनेट डिस्कनेक्टेड - स्थानीय ऑफ़लाइन AI सक्रिय'}
        >
          {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
          <span>{isOnline ? 'ऑनलाइन' : 'ऑफ़लाइन AI'}</span>
        </div>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <span>भाषा:</span>
        <span className="text-slate-200 font-medium">{languageLabels[languagePreference]}</span>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <span>मॉडल:</span>
        <span className="text-slate-200 font-medium">{isOnline ? 'Gemini 3.1 Flash' : 'स्थानीय AI'}</span>
      </div>

      {/* Zone 3: Actions (Android App, Export TXT, New Chat & Settings) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Android App / APK Guide Trigger */}
        {onOpenAndroidGuide && (
          <button
            onClick={onOpenAndroidGuide}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="Mera AI को Android फोन पर इंस्टॉल करें या APK बनाएँ"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Android ऐप</span>
          </button>
        )}

        {/* Export Current Conversation as Text File (.txt) */}
        {canExport && onExportTxt && (
          <button
            onClick={onExportTxt}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-cyan-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="वर्तमान बातचीत को .txt फ़ाइल में डाउनलोड करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">चैट सहेजें (.txt)</span>
          </button>
        )}

        {/* WhatsApp Share Button */}
        {canExport && onOpenWhatsAppShare && (
          <button
            onClick={onOpenWhatsAppShare}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="बातचीत का सारांश या संदेश WhatsApp पर साझा करें"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        )}

        {/* YouTube Studio Tool Trigger */}
        {onOpenYouTubeStudio && (
          <button
            onClick={onOpenYouTubeStudio}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="YouTube AI स्टूडियो (वीडियो सारांश, स्क्रिप्ट, टाइटल्स)"
          >
            <Youtube className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">YouTube AI</span>
          </button>
        )}

        {/* Web Browsing System Trigger */}
        {onOpenWebBrowsing && (
          <button
            onClick={onOpenWebBrowsing}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="वेब ब्राउज़िंग सिस्टम (URL रीडर व लाइव वेब सर्च)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">वेब ब्राउज़र</span>
          </button>
        )}

        <button
          onClick={onNewChat}
          className="min-h-[40px] px-3 md:px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="नई बातचीत शुरू करें"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">नई बातचीत</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors focus-visible:outline-none"
          title="सेटिंग्स व भाषा (Settings)"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
