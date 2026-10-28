import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Search,
  Sparkles,
  Check,
  Edit2,
  Youtube,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Conversation, PersonaKey } from '../types.ts';
import { PERSONAS } from '../constants.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  currentPersona: PersonaKey;
  onSelectPersona: (p: PersonaKey) => void;
  onOpenYouTubeStudio?: () => void;
  onOpenWebBrowsing?: () => void;
  onOpenAndroidGuide?: () => void;
  isOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onClearAll,
  currentPersona,
  onSelectPersona,
  onOpenYouTubeStudio,
  onOpenWebBrowsing,
  onOpenAndroidGuide,
  isOnline = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const content = (
    <aside className="w-72 sm:w-80 h-full flex flex-col bg-slate-950 border-r border-slate-800/80 text-slate-200 select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="font-bold text-sm tracking-tight text-white">Mera AI</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action: New Chat & YouTube Studio */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 768) onClose();
          }}
          className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-amber-400/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>नई बातचीत शुरू करें</span>
        </button>

        {onOpenYouTubeStudio && (
          <button
            onClick={() => {
              onOpenYouTubeStudio();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full h-9 px-3 text-xs font-semibold text-rose-200 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Youtube className="w-4 h-4 text-rose-400" />
            <span>YouTube स्टूडियो (AI टूल)</span>
          </button>
        )}

        {onOpenWebBrowsing && (
          <button
            onClick={() => {
              onOpenWebBrowsing();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full h-9 px-3 text-xs font-semibold text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-800/60 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>वेब ब्राउज़िंग सिस्टम</span>
          </button>
        )}

        {onOpenAndroidGuide && (
          <button
            onClick={() => {
              onOpenAndroidGuide();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full h-9 px-3 text-xs font-semibold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android ऐप (APK / PWA)</span>
          </button>
        )}
      </div>

      {/* Mode / Persona Quick Select Pills */}
      <div className="px-3 pb-2">
        <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>साथी का स्वभाव (Persona)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.values(PERSONAS).map((p) => {
            const isSelected = p.id === currentPersona;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={`text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                <span className="truncate">{p.hindiName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input if conversations exist */}
      {conversations.length > 3 && (
        <div className="px-3 py-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="बातचीत खोजें..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>पिछली बातचीत ({conversations.length})</span>
          {conversations.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
              title="सभी हटाएं"
            >
              साफ़ करें
            </button>
          )}
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-400">
            {searchQuery ? 'कोई बातचीत नहीं मिली' : 'अभी तक कोई बातचीत नहीं है। ऊपर दिए बटन से शुरू करें!'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isRenaming = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group relative rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-slate-900 border border-slate-700/80 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => handleSaveRename(conv.id, e)}
                      className="flex-1 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={(e) => handleSaveRename(conv.id, e)}
                        className="w-full bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="text-amber-400 hover:text-amber-300 p-0.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate">{conv.title || 'नई बातचीत'}</span>
                  )}
                </div>

                {!isRenaming && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRename(conv, e)}
                      className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors"
                      title="नाम बदलें"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => onDeleteConversation(conv.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info & Connection Status */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className={isOnline ? 'text-emerald-300' : 'text-amber-300'}>
            {isOnline ? 'ऑनलाइन (Gemini)' : 'ऑफ़लाइन (लोकल AI)'}
          </span>
        </div>
        <span className="font-mono text-slate-500">Android PWA</span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div
        className={`hidden md:block transition-all duration-200 ease-in-out shrink-0 ${
          isOpen ? 'w-72 sm:w-80' : 'w-0 overflow-hidden border-none'
        }`}
      >
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer body */}
          <div className="relative z-10 h-full max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
