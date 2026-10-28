import React, { useState } from 'react';
import {
  X,
  Youtube,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  FileText,
  Clock,
  Tag,
  Image,
  Zap,
  Play,
  ExternalLink,
  RefreshCw,
  Sliders,
  Share2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { YouTubeMetadata, YouTubeToolAction, LanguagePreference } from '../types.ts';

interface YouTubeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string, title?: string) => void;
  defaultLanguage?: LanguagePreference;
}

export const YouTubeStudioModal: React.FC<YouTubeStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  defaultLanguage = 'hindi',
}) => {
  const [activeTab, setActiveTab] = useState<'summarizer' | 'creator'>('summarizer');

  // Summarizer state
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<YouTubeMetadata | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Creator state
  const [creatorTopic, setCreatorTopic] = useState('');
  const [creatorTone, setCreatorTone] = useState<'viral' | 'educational' | 'casual' | 'story'>('viral');
  const [language, setLanguage] = useState<string>(
    defaultLanguage === 'english' ? 'english' : defaultLanguage === 'hinglish' ? 'hinglish' : 'hindi'
  );

  // Output generation state
  const [currentAction, setCurrentAction] = useState<YouTubeToolAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract YouTube video ID
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
    const match = cleanUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  };

  // Fetch YouTube Metadata
  const handleFetchMetadata = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || videoUrl).trim();
    if (!urlToFetch) {
      setMetadataError('कृपया एक YouTube वीडियो URL दर्ज करें।');
      return;
    }

    const vidId = extractVideoId(urlToFetch);
    if (!vidId) {
      setMetadataError('मान्य YouTube URL नहीं मिला (उदाहरण: https://www.youtube.com/watch?v=...)');
      return;
    }

    setIsLoadingMetadata(true);
    setMetadataError(null);

    try {
      const res = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'वीडियो विवरण प्राप्त नहीं हो सका।');
      }

      setVideoMetadata({
        videoId: data.videoId,
        title: data.title,
        author: data.author,
        authorUrl: data.authorUrl,
        thumbnailUrl: data.thumbnailUrl,
        embedUrl: data.embedUrl,
        url: data.url,
      });

      if (!creatorTopic) {
        setCreatorTopic(data.title);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMetadataError(error.message || 'YouTube वीडियो डेटा लाने में त्रुटि हुई।');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Run AI Tool
  const handleRunTool = async (action: YouTubeToolAction, customNotes?: string) => {
    setCurrentAction(action);
    setIsGenerating(true);
    setGenerationError(null);
    setCopied(false);

    try {
      const payload: {
        action: YouTubeToolAction;
        language: string;
        videoData?: {
          title: string;
          author?: string;
          url?: string;
          userNotes?: string;
        };
        topic?: string;
        customInstructions?: string;
      } = {
        action,
        language,
        topic: creatorTopic.trim() || videoMetadata?.title || '',
        customInstructions: customNotes || '',
      };

      if (videoMetadata) {
        payload.videoData = {
          title: videoMetadata.title,
          author: videoMetadata.author,
          url: videoMetadata.url,
          userNotes: customNotes,
        };
      }

      const res = await fetch('/api/youtube/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'यूट्यूब AI टूल चलाने में त्रुटि हुई।');
      }

      setGeneratedContent(data.content);
    } catch (err: unknown) {
      const error = err as Error;
      setGenerationError(error.message || 'उत्तर जनरेट करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportChat = () => {
    if (!generatedContent) return;
    const title = videoMetadata?.title || creatorTopic || 'YouTube Studio Output';
    onSendToChat(
      `📹 **YouTube AI Studio विश्लेषण**: \n\n${generatedContent}`,
      title
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#070d1e] border border-blue-900/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/60 overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="youtube-studio-title"
      >
        {/* Header Strip */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-950/90 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-blue-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="youtube-studio-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Mera AI · YouTube स्टूडियो
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Pro Tools
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                वीडियो सारांश, वायरल टाइटल्स, वर्ड-टू-वर्ड स्क्रिप्ट और संपूर्ण SEO पैकेज
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[#050917] p-1 rounded-xl border border-blue-950">
              <button
                onClick={() => {
                  setActiveTab('summarizer');
                  setGenerationError(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'summarizer'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>वीडियो समझो</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('creator');
                  setGenerationError(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'creator'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>क्रिएटर AI</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Options Strip: Language & Tone */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#09132b]/60 border border-blue-950 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">भाषा (Output Language):</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'hindi', label: '🇮🇳 हिंदी' },
                  { id: 'hinglish', label: '🗣️ Hinglish' },
                  { id: 'english', label: '🌐 English' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      language === l.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-blue-950/80'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'creator' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">टोन (Tone):</span>
                <select
                  value={creatorTone}
                  onChange={(e) => setCreatorTone(e.target.value as any)}
                  className="bg-slate-900 border border-blue-900 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="viral">🔥 वायरल व आकर्षक (Viral)</option>
                  <option value="educational">📚 ज्ञानवर्धक व विस्तृत (Educational)</option>
                  <option value="casual">😄 दोस्ताना व फन (Casual)</option>
                  <option value="story">📖 कहानी शैली (Storytelling)</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: SUMMARIZER & VIDEO ANALYZER */}
          {activeTab === 'summarizer' && (
            <div className="space-y-4">
              {/* URL Input Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchMetadata();
                    }}
                    placeholder="यूट्यूब वीडियो लिंक यहाँ पेस्ट करें (e.g. https://www.youtube.com/watch?v=...)"
                    className="w-full bg-[#050917] border border-blue-900/80 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleFetchMetadata()}
                  disabled={isLoadingMetadata || !videoUrl.trim()}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-rose-600/30"
                >
                  {isLoadingMetadata ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>वीडियो लोड करें</span>
                </button>
              </div>

              {metadataError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                  {metadataError}
                </div>
              )}

              {/* Video Card Preview */}
              {videoMetadata && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#09132b]/80 border border-blue-900 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800 group">
                    <img
                      src={videoMetadata.thumbnailUrl}
                      alt={videoMetadata.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-rose-600/90 flex items-center justify-center shadow-md">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/60">
                        {videoMetadata.author}
                      </span>
                      <a
                        href={videoMetadata.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline underline-offset-2"
                      >
                        YouTube पर देखें
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-2">
                      {videoMetadata.title}
                    </h3>

                    {/* AI Actions for Loaded Video */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleRunTool('summarize')}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>मुख्य सारांश व सीख (Summary)</span>
                      </button>

                      <button
                        onClick={() =>
                          handleRunTool(
                            'summarize',
                            'कृपया केवल 5 सबसे महत्वपूर्ण सीखें (Key Takeaways) और एक्शन स्टेप्स दें।'
                          )
                        }
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>5 मुख्य सीखें (Takeaways)</span>
                      </button>

                      <button
                        onClick={() =>
                          handleRunTool(
                            'summarize',
                            'कृपया इस वीडियो के लिए विस्तृत टाइमस्टैम्प्स (Chapters) और विषय सूची बनाएं।'
                          )
                        }
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>टाइमस्टैम्प आउटलाइन (Chapters)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Quick Links */}
              {!videoMetadata && (
                <div className="p-4 rounded-xl bg-[#060c1d] border border-blue-950 text-xs text-slate-400">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>यूट्यूब वीडियो से आप क्या-क्या जान सकते हैं:</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                    <li>लंबी पॉडकास्ट, लेक्चर्स या इंटरव्यू का 2 मिनट में हिंदी सार (Summary)</li>
                    <li>वीडियो की मुख्य सीखें और एक्शन पॉइंट्स (Key Takeaways)</li>
                    <li>अनुमानित टाइमस्टैम्प्स और अध्यायों की सूची (Chapters)</li>
                    <li>सीधे चैट में सवाल पूछकर वीडियो के किसी भी हिस्से को समझना</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATOR STUDIO AI */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              {/* Creator Topic Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>वीडियो का विषय या विचार (Video Topic / Title Idea):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={creatorTopic}
                    onChange={(e) => setCreatorTopic(e.target.value)}
                    placeholder="उदा: 2026 में AI टूल्स से फ्रीलांसिंग कैसे शुरू करें"
                    className="flex-1 bg-[#050917] border border-blue-900/80 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                  {videoMetadata && (
                    <button
                      onClick={() => setCreatorTopic(videoMetadata.title)}
                      className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors whitespace-nowrap"
                      title="लोड की गई वीडियो का शीर्षक प्रयोग करें"
                    >
                      वीडियो से भरें
                    </button>
                  )}
                </div>
              </div>

              {/* Creator Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <button
                  onClick={() => handleRunTool('titles')}
                  disabled={isGenerating || !creatorTopic.trim()}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    currentAction === 'titles'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#081229] border-blue-950 hover:border-amber-500/60 text-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-xs">10 वायरल टाइटल्स</div>
                    <div className="text-[10px] text-slate-400">High CTR हुक व सूत्र</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunTool('script')}
                  disabled={isGenerating || !creatorTopic.trim()}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    currentAction === 'script'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#081229] border-blue-950 hover:border-rose-500/60 text-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-bold text-xs">फुल वीडियो स्क्रिप्ट</div>
                    <div className="text-[10px] text-slate-400">हुक, बॉडी व आउट्रो</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunTool('seo')}
                  disabled={isGenerating || !creatorTopic.trim()}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    currentAction === 'seo'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-[#081229] border-blue-950 hover:border-cyan-500/60 text-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-bold text-xs">SEO विवरण व 25 टैग्स</div>
                    <div className="text-[10px] text-slate-400">कॉपी-पेस्ट रेडी</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunTool('thumbnail')}
                  disabled={isGenerating || !creatorTopic.trim()}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    currentAction === 'thumbnail'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-[#081229] border-blue-950 hover:border-purple-500/60 text-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Image className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold text-xs">3 थंबनेल आइडियाज़</div>
                    <div className="text-[10px] text-slate-400">टेक्स्ट + AI प्रॉम्प्ट</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunTool('shorts')}
                  disabled={isGenerating || !creatorTopic.trim()}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    currentAction === 'shorts'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#081229] border-blue-950 hover:border-emerald-500/60 text-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-xs">शॉर्ट्स / रील्स (60s)</div>
                    <div className="text-[10px] text-slate-400">फास्ट-पेस्ड वायरल स्क्रिप्ट</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="p-8 rounded-2xl bg-[#050a1a] border border-blue-900/60 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-3 border-rose-500/30 border-t-rose-500 animate-spin" />
                <Youtube className="w-5 h-5 text-rose-500 absolute inset-0 m-auto" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Mera AI यूट्यूब इंटेलिजेंस काम कर रहा है...
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                सर्वोत्तम गुणवत्ता और भारतीय यूट्यूब मानकों के अनुसार सामग्री तैयार की जा रही है
              </p>
            </div>
          )}

          {/* Error Message */}
          {generationError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-200">
              <div className="font-semibold mb-1">त्रुटि (Error):</div>
              <div>{generationError}</div>
            </div>
          )}

          {/* Results Output View */}
          {generatedContent && !isGenerating && (
            <div className="rounded-2xl bg-[#050a1a] border border-blue-900/80 overflow-hidden shadow-xl animate-in fade-in duration-200">
              {/* Output Action Bar */}
              <div className="px-4 py-2.5 bg-blue-950/70 border-b border-blue-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>परिणाम (AI Studio Output)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">कॉपी हो गया!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>कॉपी करें</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportChat}
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>चैट में जारी रखें</span>
                  </button>
                </div>
              </div>

              {/* Output Markdown Text */}
              <div className="p-4 sm:p-6 prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200 leading-relaxed overflow-x-auto selection:bg-rose-500 selection:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-blue-950 bg-[#050a19] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Gemini 3.1 Flash Lite संचालित</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
