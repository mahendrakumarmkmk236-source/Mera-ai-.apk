import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  AlertCircle,
  AlertTriangle,
  FileText,
  Globe,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
  onRetrySearch?: (query?: string) => void;
  onAskWithoutSearch?: (query?: string) => void;
  onShareWhatsApp?: (message: ChatMessageType) => void;
  onOpenWebBrowsing?: (url?: string) => void;
  isPlayingAudio?: boolean;
  onPlayAudio?: (text: string) => void;
  onStopAudio?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onRetrySearch,
  onAskWithoutSearch,
  onShareWhatsApp,
  onOpenWebBrowsing,
  isPlayingAudio = false,
  onPlayAudio,
  onStopAudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const isUser = message.role === 'user';

  const directWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `*Mera AI - ${isUser ? 'सवाल' : 'उत्तर'}:*\n\n${message.content.slice(0, 2500)}\n\n—\n_Mera AI (Hindi/English AI Assistant)_`
  )}`;

  const detectedUrls = React.useMemo(() => {
    if (!message.content) return [];
    const matches = message.content.match(/(https?:\/\/[^\s]+)/gi) || [];
    return Array.from(new Set(matches.map((u) => u.replace(/[),.;]+$/, ''))));
  }, [message.content]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isThinking = !isUser && message.isStreaming && !message.content;

  return (
    <div
      className={`py-3.5 md:py-4 px-3 sm:px-4 md:px-6 flex gap-3 sm:gap-4 transition-colors ${
        isUser
          ? 'justify-end'
          : 'justify-start bg-[#060c1d]/60 border-y border-blue-950/40'
      }`}
    >
      <div
        className={`flex gap-3 sm:gap-4 max-w-full lg:max-w-4xl ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        } ${isUser ? 'items-end' : 'items-start'}`}
      >
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 flex items-center justify-center text-xs font-semibold text-white shadow-sm shadow-blue-500/10">
              आप
            </div>
          ) : (
            <BrandLogo size="sm" />
          )}
        </div>

        {/* Message Content Container */}
        <div
          className={`flex flex-col min-w-0 ${
            isUser ? 'items-end' : 'items-start'
          }`}
        >
          {/* Metadata header */}
          <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
            <span className="font-medium text-slate-300">
              {isUser ? 'आप' : 'Mera AI'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{formattedTime}</span>
            {message.sources && message.sources.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-cyan-400 font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  वेब सत्यापित
                </span>
              </>
            )}
          </div>

          {/* Attached image or PDF preview if present */}
          {message.attachment && (
            <div className="mb-2 max-w-xs sm:max-w-sm rounded-xl overflow-hidden border border-blue-900/60 bg-[#091126] shadow-sm">
              {message.attachment.isPdf ? (
                <div className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {message.attachment.name || 'document.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PDF दस्तावेज़ · {(message.attachment.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={message.attachment.previewUrl || `data:${message.attachment.mimeType};base64,${message.attachment.data}`}
                    alt="संलग्न फोटो"
                    className="w-full max-h-60 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {message.attachment.name && (
                    <div className="px-2.5 py-1 bg-black/70 backdrop-blur-xs text-[10px] text-slate-300 truncate">
                      {message.attachment.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message bubble / Markdown body */}
          <div
            className={`rounded-2xl px-4 py-2.5 sm:py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-50 rounded-br-none shadow-sm'
                : 'bg-transparent text-slate-100 w-full'
            }`}
          >
            {message.error ? (
              message.errorType === 'SEARCH_QUOTA_EXHAUSTED' ? (
                /* Specialized 429 Google Search Quota Card */
                <div className="flex flex-col gap-3 p-4 bg-[#110d06] border border-amber-500/40 rounded-xl text-xs text-amber-200/95 shadow-md shadow-amber-950/20 max-w-lg">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300">Google Search कोटा सीमा (429 Rate Limit)</h4>
                      <p className="text-[10px] text-amber-400/70 font-normal">Gemini Search Grounding Quota Exceeded</p>
                    </div>
                  </div>

                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {message.content ||
                      'Gemini API में Google Search grounding के प्रति-मिनट अनुरोध (Queries Per Minute) की सीमा समाप्त हो गई है। API नियमों के अनुसार कोटा को बायपास नहीं किया गया है।'}
                  </p>

                  <div className="p-2.5 bg-black/40 rounded-lg border border-amber-500/20 text-[11px] text-amber-200/80">
                    💡 <strong>सुझाव:</strong> यदि आप लगातार ताज़ा वेब सर्च चाहते हैं, तो AI Studio में Billing-enabled API Key का उपयोग करें। अभी के लिए आप नीचे दिए गए विकल्पों में से चुन सकते हैं:
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {onRetrySearch && (
                      <button
                        type="button"
                        onClick={() => onRetrySearch(message.lastQuery)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>🔄 सर्च के साथ पुनः प्रयास करें</span>
                      </button>
                    )}

                    {onAskWithoutSearch && (
                      <button
                        type="button"
                        onClick={() => onAskWithoutSearch(message.lastQuery)}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>⚡ बिना सर्च के तुरंत उत्तर पाएँ</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard Error Card */
                <div className="flex flex-col gap-2 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>माफ़ कीजिये, अनुरोध संसाधित करने में समस्या आई।</span>
                  </div>
                  {message.content && (
                    <p className="text-[11px] text-rose-400/80 font-mono bg-rose-950/60 p-2 rounded">
                      {message.content}
                    </p>
                  )}
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="self-start px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors mt-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>पुनः प्रयास करें (Retry)</span>
                    </button>
                  )}
                </div>
              )
            ) : isThinking ? (
              /* Animated Loading Indicator */
              <div className="flex items-center gap-3 py-1.5 px-2 text-xs text-blue-300/90 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                </div>
                <span>Mera AI सोच रहा है...</span>
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            ) : (
              <div className="prose-chat break-words overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      const isInline = !match && !codeString.includes('\n');

                      if (isInline) {
                        return (
                          <code className="text-cyan-300 bg-blue-950/70 border border-blue-900/40 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }

                      const lang = match ? match[1] : 'code';
                      const codeIndex = Math.floor(Math.random() * 10000);

                      return (
                        <div className="relative my-3 rounded-xl overflow-hidden border border-blue-950 bg-[#030611]">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#081024] border-b border-blue-950 text-[11px] text-blue-300/80 font-mono">
                            <span>{lang}</span>
                            <button
                              onClick={() => copyCode(codeString, codeIndex)}
                              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                              title="कोड कॉपी करें"
                            >
                              {copiedCodeIndex === codeIndex ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">कॉपी हुआ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>कॉपी</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-200">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {/* Streaming cursor */}
                {message.isStreaming && message.content && (
                  <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse rounded-xs align-middle" />
                )}
              </div>
            )}
          </div>

          {/* Detected URL Quick Actions */}
          {detectedUrls.length > 0 && onOpenWebBrowsing && !message.error && (
            <div className={`mt-2 flex flex-wrap gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {detectedUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onOpenWebBrowsing(url)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs group"
                  title={`${url} को Mera AI ब्राउज़र में खोलें`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[200px]">{url}</span>
                  <span className="text-[10px] text-cyan-300 font-semibold px-1 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                    ब्राउज़ करें
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Web Sources & Citations Section */}
          {!isUser && message.sources && message.sources.length > 0 && !message.error && (
            <div className="mt-3 w-full p-3 rounded-xl bg-[#070f24] border border-blue-900/40 text-xs">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-950/80">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>स्रोत व संदर्भ (Web Sources · {message.sources.length})</span>
                </div>
                {message.searchQueries && message.searchQueries.length > 0 && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    सर्च: {message.searchQueries[0]}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#040816] border border-blue-950 hover:border-cyan-500/50 hover:bg-[#08122c] transition-all group flex items-start gap-2 text-slate-200"
                  >
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 flex items-start gap-2"
                      title={src.uri}
                    >
                      <div className="w-5 h-5 rounded-md bg-blue-950 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 group-hover:text-cyan-300">
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                          {src.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {src.domain || src.uri}
                        </p>
                      </div>
                    </a>
                    {onOpenWebBrowsing && (
                      <button
                        type="button"
                        onClick={() => onOpenWebBrowsing(src.uri)}
                        className="px-1.5 py-1 rounded bg-blue-950/70 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-200 text-[10px] font-medium border border-blue-900/60 shrink-0 flex items-center gap-1"
                        title="Mera AI वेब ब्राउज़र में खोलें"
                      >
                        <Globe className="w-3 h-3" />
                        <span className="hidden xs:inline">ब्राउज़</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons under assistant response */}
          {!isUser && !message.isStreaming && message.content && !message.error && (
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
              <button
                onClick={() => copyToClipboard(message.content)}
                className="min-h-[36px] px-2.5 py-1 text-xs rounded-lg hover:bg-blue-950/60 hover:text-slate-200 transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                title="पूरा उत्तर कॉपी करें"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">कॉपी हुआ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>कॉपी</span>
                  </>
                )}
              </button>

              {/* WhatsApp Share Button */}
              {onShareWhatsApp ? (
                <button
                  onClick={() => onShareWhatsApp(message)}
                  className="min-h-[36px] px-2.5 py-1 text-xs rounded-lg hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-400 transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                  title="यह उत्तर WhatsApp पर साझा करें"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">WhatsApp</span>
                </button>
              ) : (
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[36px] px-2.5 py-1 text-xs rounded-lg hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-400 transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                  title="यह उत्तर WhatsApp पर साझा करें"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">WhatsApp</span>
                </a>
              )}

              {/* Text-to-Speech audio button */}
              {onPlayAudio && onStopAudio && (
                <button
                  onClick={() => {
                    if (isPlayingAudio) {
                      onStopAudio();
                    } else {
                      onPlayAudio(message.content);
                    }
                  }}
                  className={`min-h-[36px] px-2.5 py-1 text-xs rounded-lg hover:bg-blue-950/60 transition-colors flex items-center gap-1.5 ${
                    isPlayingAudio
                      ? 'text-cyan-400 font-semibold bg-cyan-500/10'
                      : 'hover:text-slate-200'
                  }`}
                  title={isPlayingAudio ? 'रोकें (Stop audio)' : 'आवाज़ में सुनें (Listen)'}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                      <span>रोकें</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>सुनें</span>
                    </>
                  )}
                </button>
              )}

              {/* Regenerate button */}
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="min-h-[36px] px-2.5 py-1 text-xs rounded-lg hover:bg-blue-950/60 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                  title="दोबारा उत्तर प्राप्त करें"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>पुनः प्रयास</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
