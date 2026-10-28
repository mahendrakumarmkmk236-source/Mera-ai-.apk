import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, MessageSquare, Sparkles, FileText, Share2, ExternalLink } from 'lucide-react';
import { Conversation, ChatMessage as ChatMessageType } from '../types.ts';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  initialMessage?: ChatMessageType | null;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
  initialMessage,
}) => {
  const [shareMode, setShareMode] = useState<'summary' | 'full' | 'single'>('summary');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  const messages = conversation?.messages || [];

  // Initialize mode based on initialMessage
  useEffect(() => {
    if (initialMessage) {
      setShareMode('single');
      setSelectedMessageId(initialMessage.id);
    } else {
      setShareMode('summary');
      setSelectedMessageId(null);
    }
  }, [initialMessage, isOpen]);

  // Generate text based on selected mode
  const generatedText = useMemo(() => {
    if (!conversation || messages.length === 0) {
      return 'Mera AI - कोई बातचीत उपलब्ध नहीं है।';
    }

    const title = conversation.title || 'Mera AI बातचीत';
    const dateStr = new Date(conversation.createdAt || Date.now()).toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // 1. Single message mode
    if (shareMode === 'single') {
      const targetMsg = messages.find((m) => m.id === selectedMessageId) || initialMessage || messages[messages.length - 1];
      if (!targetMsg) return '';

      const senderLabel = targetMsg.role === 'user' ? '👤 *मेरा सवाल:*' : '🤖 *Mera AI का उत्तर:*';
      let content = targetMsg.content.trim();
      // Clean up markdown headers for WhatsApp (*bold* instead of #)
      content = content.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');

      return `${senderLabel}\n\n${content}\n\n—\n_Mera AI (Hindi & English AI Assistant) द्वारा साझा किया गया_`;
    }

    // 2. Full conversation mode
    if (shareMode === 'full') {
      let fullTranscript = `*Mera AI - बातचीत का विवरण*\n`;
      fullTranscript += `📌 *विषय:* ${title}\n`;
      fullTranscript += `📅 *दिनांक:* ${dateStr}\n`;
      fullTranscript += `============================\n\n`;

      for (const msg of messages) {
        const sender = msg.role === 'user' ? '👤 *आप:*' : '🤖 *Mera AI:*';
        let clean = msg.content.trim();
        clean = clean.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');
        fullTranscript += `${sender}\n${clean}\n\n----------------------------\n\n`;
      }

      fullTranscript += `_Mera AI (Hindi/English AI Assistant)_`;
      return fullTranscript;
    }

    // 3. Conversation summary mode (Default & Recommended)
    const userMsgs = messages.filter((m) => m.role === 'user');
    const assistantMsgs = messages.filter((m) => m.role === 'assistant');

    let summaryText = `*Mera AI - बातचीत का मुख्य सार (Summary)*\n`;
    summaryText += `📌 *विषय:* ${title}\n`;
    summaryText += `📅 *दिनांक:* ${dateStr}\n\n`;

    if (userMsgs.length > 0) {
      summaryText += `*❓ पूछे गए मुख्य सवाल:*\n`;
      userMsgs.slice(0, 3).forEach((m, idx) => {
        const clean = m.content.replace(/\s+/g, ' ').trim();
        const snippet = clean.length > 90 ? clean.slice(0, 90) + '...' : clean;
        summaryText += `${idx + 1}. ${snippet}\n`;
      });
      summaryText += `\n`;
    }

    if (assistantMsgs.length > 0) {
      summaryText += `*💡 मुख्य उत्तर व सीख (Key Takeaways):*\n`;
      const lastAnswer = assistantMsgs[assistantMsgs.length - 1].content;
      let cleanAnswer = lastAnswer
        .replace(/^#{1,6}\s+(.+)$/gm, '*$1*')
        .trim();
      
      if (cleanAnswer.length > 1200) {
        cleanAnswer = cleanAnswer.slice(0, 1200) + '...\n_(विस्तृत उत्तर के लिए Mera AI देखें)_';
      }
      summaryText += `${cleanAnswer}\n\n`;
    }

    summaryText += `—\n_Mera AI (Hindi & English AI Assistant) द्वारा साझा किया गया_`;
    return summaryText;
  }, [conversation, messages, shareMode, selectedMessageId, initialMessage]);

  // Update editable text whenever generatedText changes
  useEffect(() => {
    setCustomText(generatedText);
  }, [generatedText]);

  if (!isOpen) return null;

  const charCount = customText.length;
  const isTooLongForUrl = charCount > 3500;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(customText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#070d1e] border border-blue-900/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/70 overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-share-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-950/90 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-blue-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
              <WhatsAppIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="whatsapp-share-title" className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>WhatsApp पर साझा करें</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Share
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                बातचीत का मुख्य सारांश या विशिष्ट संदेश सीधे WhatsApp पर भेजें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Mode Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              क्या साझा करना चाहते हैं? (Select Content Type):
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#050917] p-1.5 rounded-xl border border-blue-950">
              <button
                type="button"
                onClick={() => setShareMode('summary')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  shareMode === 'summary'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>मुख्य सारांश</span>
              </button>

              <button
                type="button"
                onClick={() => setShareMode('single')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  shareMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>एक संदेश</span>
              </button>

              <button
                type="button"
                onClick={() => setShareMode('full')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  shareMode === 'full'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>पूरी चैट</span>
              </button>
            </div>
          </div>

          {/* If Single Message Mode: Message Selector */}
          {shareMode === 'single' && messages.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                संदेश चुनें (Select Message to Share):
              </label>
              <select
                value={selectedMessageId || ''}
                onChange={(e) => setSelectedMessageId(e.target.value)}
                className="w-full bg-[#050917] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {messages.map((m, idx) => {
                  const roleName = m.role === 'user' ? 'आप' : 'Mera AI';
                  const preview = m.content.replace(/\s+/g, ' ').slice(0, 60);
                  return (
                    <option key={m.id} value={m.id}>
                      #{idx + 1} [{roleName}]: {preview}...
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Editable WhatsApp Text Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp मैसेज प्रीव्यू (आप यहाँ एडिट भी कर सकते हैं):</span>
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isTooLongForUrl
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {charCount} अक्षर {isTooLongForUrl ? '(बड़ा संदेश - कॉपी करना बेहतर)' : ''}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={9}
                className="w-full bg-[#050b18] border border-blue-900/80 focus:border-emerald-500 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 leading-relaxed font-mono focus:outline-none resize-none transition-colors"
                placeholder="व्हाट्सएप पर साझा करने योग्य संदेश यहाँ दिखेगा..."
              />
            </div>
          </div>

          {/* Info note */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-200/90 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>टिप:</strong> 'WhatsApp पर भेजें' बटन पर क्लिक करते ही WhatsApp (मोबाइल ऐप या Web) खुल जाएगा और यह टेक्स्ट सीधे चैट बॉक्स में भर जाएगा।
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-blue-950 bg-[#050a19] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">टेक्स्ट कॉपी हुआ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>टेक्स्ट कॉपी करें</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              रद्द करें
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Keep modal open or close shortly
                setTimeout(onClose, 500);
              }}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/30 active:scale-[0.98] transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>WhatsApp पर भेजें</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
