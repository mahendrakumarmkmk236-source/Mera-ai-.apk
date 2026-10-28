import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  X,
  FileText,
  Sparkles,
  Youtube,
  Play,
  Compass,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { AttachedFile } from '../types.ts';

interface ChatInputProps {
  onSendMessage: (content: string, attachment?: AttachedFile) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  onOpenFutureFeatures: () => void;
  onOpenYouTubeStudio?: () => void;
  onOpenWebBrowsing?: () => void;
  onOpenAndroidGuide?: () => void;
  isOnline?: boolean;
  placeholder?: string;
}

// Check Web Speech Recognition support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  enableWebSearch,
  onToggleWebSearch,
  onOpenFutureFeatures,
  placeholder = 'Mera AI से कुछ भी पूछें (हिंदी, Hinglish या English)...',
  onOpenYouTubeStudio,
  onOpenWebBrowsing,
  onOpenAndroidGuide,
  isOnline = true,
}) => {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const youtubeMatch = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );

  const webUrlMatch =
    !youtubeMatch &&
    input.match(
      /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&//=]*|www\.[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&//=]*)/i
    );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Handle Speech Recognition
  const toggleListening = () => {
    if (!SpeechRecognitionAPI) {
      alert('आपके ब्राउज़र में आवाज़ पहचान (Web Speech) उपलब्ध नहीं है। कृपया Chrome या Edge का उपयोग करें।');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'hi-IN'; // Default Hindi voice dictation, also understands English
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  // Handle File Upload (Photos & PDF)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('कृपया केवल फोटो (JPG, PNG, WebP) या PDF दस्तावेज़ अपलोड करें।');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('फ़ाइल का आकार 20MB से कम होना चाहिए।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedFile({
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        data: result,
        previewUrl: isImage ? result : '',
        name: file.name,
        size: file.size,
        isPdf,
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachedFile) return;

    onSendMessage(trimmed, attachedFile || undefined);
    setInput('');
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full bg-[#030712]/95 backdrop-blur-md border-t border-blue-950/80 px-2 sm:px-4 pt-2 pb-safe">
      <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
        {/* Attached file preview strip */}
        {attachedFile && (
          <div className="flex items-center gap-2 p-2 bg-[#091126] border border-blue-900/60 rounded-xl max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
            {attachedFile.isPdf ? (
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            ) : (
              <img
                src={attachedFile.previewUrl}
                alt="Upload preview"
                className="w-8 h-8 rounded-lg object-cover border border-blue-800 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{attachedFile.name}</p>
              <p className="text-[10px] text-slate-400">
                {attachedFile.isPdf ? 'PDF दस्तावेज़' : 'फ़ोटो'}{' '}
                {(attachedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-blue-950 transition-colors"
              title="हटाएं"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Web Search Active Notification Strip */}
        {enableWebSearch && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/50 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                <strong>Web Search ON:</strong> इंटरनेट से ताज़ा जानकारी व स्रोत लिंक (Sources) प्राप्त होंगे।
              </span>
            </div>
            <button
              onClick={onToggleWebSearch}
              className="text-[11px] text-cyan-400 hover:text-cyan-200 underline shrink-0 ml-2"
            >
              बंद करें
            </button>
          </div>
        )}

        {/* Voice listening indicator strip */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>आवाज़ सुन रहा हूँ... बोलिए (हिंदी या अंग्रेज़ी में)</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-xs text-rose-300 underline font-medium hover:text-white"
            >
              रोकें
            </button>
          </div>
        )}

        {/* YouTube Video URL detected strip */}
        {youtubeMatch && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-rose-950/80 via-red-950/70 to-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <Youtube className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">
                <strong className="text-white">YouTube लिंक पहचाना गया:</strong> सारांश व क्रिएटर टूल उपलब्ध
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  onSendMessage(
                    `कृपया इस YouTube वीडियो (${youtubeMatch[0]}) का संपूर्ण सारांश, 5 मुख्य सीखें, टाइमस्टैम्प आउटलाइन और व्यावहारिक विश्लेषण हिंदी में विस्तार से समझाएं।`
                  );
                  setInput('');
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>सारांश निकालें</span>
              </button>

              {onOpenYouTubeStudio && (
                <button
                  type="button"
                  onClick={onOpenYouTubeStudio}
                  className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>स्टूडियो में खोलें</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* General Webpage URL detected strip */}
        {webUrlMatch && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-cyan-950/80 border border-cyan-500/50 rounded-xl text-xs text-cyan-200 animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">
                <strong className="text-white">वेबसाइट लिंक मिली:</strong> वेबपेज का सार व विश्लेषण उपलब्ध
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  onSendMessage(
                    `कृपया इस वेबसाइट (${webUrlMatch[0]}) का संपूर्ण सार, मुख्य बिंदु और निष्कर्ष हिंदी में विस्तार से समझाएं।`
                  );
                  setInput('');
                }}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
              >
                <Compass className="w-3 h-3" />
                <span>पेज पढ़ें व समझें</span>
              </button>

              {onOpenWebBrowsing && (
                <button
                  type="button"
                  onClick={onOpenWebBrowsing}
                  className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>ब्राउज़र में खोलें</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Offline Banner Indicator */}
        {!isOnline && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-[11px] text-amber-200 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>ऑफ़लाइन मोड (Local AI सक्रिय):</strong> इंटरनेट नहीं है — स्थानीय AI मॉडल से चैट जारी रखें।
              </span>
            </div>
            <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/20">
              ऑफ़लाइन
            </span>
          </div>
        )}

        {/* Input Bar Container */}
        <div className="relative flex items-end gap-1 sm:gap-2 bg-[#081024] border border-blue-900/50 rounded-2xl p-1.5 sm:p-2 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/10 shadow-lg shadow-black/40 transition-all">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Left Actions: Attach File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-blue-300 hover:text-white hover:bg-blue-950/80 transition-colors shrink-0 cursor-pointer"
            title="फ़ोटो या PDF दस्तावेज़ जोड़ें"
            aria-label="Attach photo or PDF"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Web Search Grounding Toggle Button with clear visual state */}
          <button
            type="button"
            onClick={onToggleWebSearch}
            className={`min-h-[44px] px-2.5 flex items-center justify-center gap-1.5 rounded-xl transition-all shrink-0 font-medium text-xs cursor-pointer ${
              enableWebSearch
                ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/80 border border-transparent'
            }`}
            title={enableWebSearch ? 'वेब सर्च चालू है (Web Search ON) - क्लिक करके बंद करें' : 'वेब सर्च चालू करें (Turn on Web Search)'}
            aria-label="Toggle web search"
          >
            <Globe className={`w-4 h-4 ${enableWebSearch ? 'text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">
              {enableWebSearch ? 'वेब सर्च: ON' : 'वेब सर्च'}
            </span>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none py-2.5 px-1 max-h-40 min-h-[44px]"
          />

          {/* Right Actions: Voice Mic */}
          <button
            type="button"
            onClick={toggleListening}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0 cursor-pointer ${
              isListening
                ? 'text-rose-400 bg-rose-950 border border-rose-500'
                : 'text-slate-400 hover:text-slate-100 hover:bg-blue-950/80'
            }`}
            title="बोलकर टाइप करें (Voice Dictation in Hindi/English)"
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send or Stop Button (Touch friendly with clear Hindi label) */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="min-h-[44px] px-3 sm:px-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              title="उत्तर रोकना (Stop generation)"
              aria-label="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-xs font-semibold hidden xs:inline">रोकें</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() && !attachedFile}
              className={`min-h-[44px] px-3.5 sm:px-4 flex items-center justify-center gap-1.5 rounded-xl transition-all shrink-0 font-semibold text-xs sm:text-sm ${
                input.trim() || attachedFile
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="संदेश भेजें (Send message)"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
              <span>भेजें</span>
            </button>
          )}
        </div>

        {/* Bottom Utility Strip */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-2">
            {enableWebSearch && (
              <span className="text-cyan-400 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Google Search ग्राउंडिंग सक्रिय
              </span>
            )}
            <span className="hidden sm:inline">Shift + Enter नई लाइन के लिए</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenAndroidGuide && (
              <button
                type="button"
                onClick={onOpenAndroidGuide}
                className="hover:text-emerald-300 text-slate-400 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                title="Mera AI Android ऐप में बदलें या इंस्टॉल करें"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Android ऐप गाइड</span>
              </button>
            )}

            {onOpenWebBrowsing && (
              <button
                type="button"
                onClick={onOpenWebBrowsing}
                className="hover:text-cyan-400 text-slate-400 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                title="वेब ब्राउज़िंग सिस्टम (URL रीडर व लाइव सर्च) खोलें"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">वेब ब्राउज़र</span>
              </button>
            )}

            {onOpenYouTubeStudio && (
              <button
                type="button"
                onClick={onOpenYouTubeStudio}
                className="hover:text-rose-400 text-slate-400 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                title="यूट्यूब वीडियो सारांश व क्रिएटर स्टूडियो खोलें"
              >
                <Youtube className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden xs:inline">YouTube स्टूडियो</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenFutureFeatures}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-slate-400 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI इमेज लैब</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
