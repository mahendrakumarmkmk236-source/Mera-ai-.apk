import React from 'react';
import { X, Globe, Sparkles, Trash2, Download, Shield, Volume2 } from 'lucide-react';
import { LanguagePreference, PersonaKey, Conversation } from '../types.ts';
import { PERSONAS } from '../constants.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  languagePreference: LanguagePreference;
  onSelectLanguage: (lang: LanguagePreference) => void;
  currentPersona: PersonaKey;
  onSelectPersona: (p: PersonaKey) => void;
  conversations: Conversation[];
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  languagePreference,
  onSelectLanguage,
  currentPersona,
  onSelectPersona,
  conversations,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mera_ai_chat_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg bg-[#081024] border border-blue-900/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-blue-950 flex items-center justify-between bg-[#040814]/90">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">सेटिंग्स (Settings)</h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-blue-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-slate-300">
          {/* Language Preference */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>पसंदीदा भाषा (Preferred Response Language)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'auto', label: 'ऑटो (Auto Detect)', desc: 'आपके संदेश की भाषा के अनुसार' },
                { id: 'hindi', label: 'शुद्ध हिंदी', desc: 'प्राकृतिक देवनागरी लिपि' },
                { id: 'hinglish', label: 'Hinglish', desc: 'कैज़ुअल रोमन हिंदी' },
                { id: 'english', label: 'English', desc: 'Clear modern English' },
              ].map((item) => {
                const isSelected = languagePreference === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectLanguage(item.id as LanguagePreference)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                        : 'bg-[#050b1a] border-blue-950 text-slate-400 hover:text-slate-200 hover:border-blue-900'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-100">{item.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Persona Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>सक्रिय AI साथी का मोड (Persona)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(PERSONAS).map((p) => {
                const isSelected = currentPersona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPersona(p.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-xs'
                        : 'bg-[#050b1a] border-blue-950 text-slate-400 hover:text-slate-200 hover:border-blue-900'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-100">{p.hindiName}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{p.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data & History Management */}
          <div className="p-3.5 rounded-xl bg-[#050b1a] border border-blue-950 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200">डेटा व चैट बैकअप (Data Management)</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportData}
                disabled={conversations.length === 0}
                className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-40 text-blue-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>चैट हिस्ट्री डाउनलोड करें (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('क्या आप सचमुच सभी पुरानी चैट हटाना चाहते हैं?')) {
                    onClearAll();
                    onClose();
                  }
                }}
                disabled={conversations.length === 0}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 disabled:opacity-40 text-rose-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सभी चैट साफ़ करें</span>
              </button>
            </div>
          </div>

          {/* System Specs */}
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>AI मॉडल:</span>
              <span className="font-mono text-slate-200">Google Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span>सुरक्षित सर्वर:</span>
              <span className="text-emerald-400 font-medium">सक्रिय (Express Node Proxy)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>थीम:</span>
              <span className="text-slate-200">ब्लैक-ब्लू प्रीमियम (Black-Blue Premium)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-950 bg-[#040814]/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all"
          >
            सहेजें व बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
