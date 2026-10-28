import React, { useState } from 'react';
import {
  X,
  Globe,
  Search,
  ExternalLink,
  Sparkles,
  FileText,
  Copy,
  Check,
  MessageSquare,
  RefreshCw,
  Zap,
  Bookmark,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LanguagePreference } from '../types.ts';

interface WebBrowsingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string, title?: string) => void;
  defaultLanguage?: LanguagePreference;
  initialUrl?: string;
}

interface FetchedPageData {
  url: string;
  domain: string;
  favicon: string;
  title: string;
  description: string;
  content: string;
  snippet: string;
}

export const WebBrowsingModal: React.FC<WebBrowsingModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  defaultLanguage = 'hindi',
  initialUrl = '',
}) => {
  const [activeTab, setActiveTab] = useState<'url_reader' | 'search' | 'directory'>('url_reader');

  // URL Reader state
  const [urlInput, setUrlInput] = useState(initialUrl || '');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [pageData, setPageData] = useState<FetchedPageData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // General state
  const [language, setLanguage] = useState<string>(
    defaultLanguage === 'english' ? 'english' : defaultLanguage === 'hinglish' ? 'hinglish' : 'hindi'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync initialUrl if provided
  React.useEffect(() => {
    if (isOpen && initialUrl) {
      setUrlInput(initialUrl);
      setActiveTab('url_reader');
      handleFetchPage(initialUrl);
    }
  }, [isOpen, initialUrl]);

  if (!isOpen) return null;

  // Fetch Page Content
  const handleFetchPage = async (customUrl?: string) => {
    const target = (customUrl || urlInput).trim();
    if (!target) {
      setPageError('कृपया एक मान्य वेबसाइट URL दर्ज करें।');
      return;
    }

    setIsLoadingPage(true);
    setPageError(null);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/browse/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'वेबपेज लोड नहीं हो सका।');
      }

      setPageData(data);
    } catch (err: unknown) {
      const error = err as Error;
      setPageError(error.message || 'वेबसाइट से डेटा लोड करने में त्रुटि आई।');
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Run AI Page Analysis
  const handleAnalyzePage = async (action: 'summarize' | 'key_facts' | 'qa') => {
    if (!pageData) return;

    setIsGenerating(true);
    setGenerationError(null);
    setCopied(false);

    try {
      const res = await fetch('/api/browse/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pageData.url,
          title: pageData.title,
          content: pageData.content,
          action,
          query: userQuery.trim(),
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'वेबपेज का विश्लेषण नहीं हो सका।');
      }

      setGeneratedResult(data.content);
    } catch (err: unknown) {
      const error = err as Error;
      setGenerationError(error.message || 'विश्लेषण करने में त्रुटि आई।');
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Live Search Grounding Query
  const handleSearchWeb = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    setIsGenerating(true);
    setGenerationError(null);
    setCopied(false);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          persona: 'general',
          languagePreference: language,
          enableWebSearch: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'वेब सर्च करने में त्रुटि आई।');
      }

      let resultWithSources = data.text || '';
      if (Array.isArray(data.sources) && data.sources.length > 0) {
        resultWithSources += '\n\n---\n### 🌐 सत्यापित वेब स्रोत (Verified Web Sources):\n';
        data.sources.forEach((s: { title: string; uri: string; domain?: string }) => {
          resultWithSources += `- [${s.title || s.domain}](${s.uri})\n`;
        });
      }

      setGeneratedResult(resultWithSources);
    } catch (err: unknown) {
      const error = err as Error;
      setGenerationError(error.message || 'सर्च परिणाम प्राप्त नहीं हो सके।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToChat = () => {
    if (!generatedResult) return;
    const title = pageData?.title || searchQuery || 'Web Browsing Result';
    onSendToChat(`🌐 **वेब ब्राउज़िंग रिपोर्ट**: \n\n${generatedResult}`, title);
    onClose();
  };

  const sampleDirectory = [
    {
      name: 'DigiLocker (डिजिलॉकर)',
      url: 'https://www.digilocker.gov.in',
      desc: 'आधार, ड्राइविंग लाइसेंस, अंकपत्र व सरकारी प्रमाण पत्र डिजिटल रूप में सुरक्षित रखें।',
    },
    {
      name: 'EPFO (कर्मचारी भविष्य निधि)',
      url: 'https://www.epfindia.gov.in',
      desc: 'PF बैलेंस, पासबुक, क्लेम स्टेटस और UAN सेवाएँ।',
    },
    {
      name: 'IRCTC (रेलवे टिकट बुकिंग)',
      url: 'https://www.irctc.co.in',
      desc: 'ट्रेन टिकट बुकिंग, PNR स्थिति व ट्रेन शेड्यूल।',
    },
    {
      name: 'National Scholarship Portal',
      url: 'https://scholarships.gov.in',
      desc: 'छात्रवृत्ति योजनाएं, आवेदन स्थिति व छात्र सहायता।',
    },
    {
      name: 'Income Tax Portal',
      url: 'https://www.incometax.gov.in',
      desc: 'ITR फाइलिंग, पैन कार्ड लिंकिंग और रिफंड स्थिति।',
    },
    {
      name: 'Wikipedia (ज्ञानकोश)',
      url: 'https://hi.wikipedia.org',
      desc: 'विश्व का सबसे बड़ा मुफ्त ज्ञानकोश व तथ्य।',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#070d1e] border border-blue-900/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/70 overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-browsing-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-950/90 flex items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/30 shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="web-browsing-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Mera AI · वेब ब्राउज़िंग सिस्टम
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Web Crawler & Live Search
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                किसी भी वेबसाइट URL को पढ़ें, समझें और इंटरनेट से ताज़ा व सत्यापित तथ्य प्राप्त करें
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[#050917] p-1 rounded-xl border border-blue-950">
              <button
                onClick={() => {
                  setActiveTab('url_reader');
                  setGenerationError(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'url_reader'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>URL रीडर</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('search');
                  setGenerationError(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>लाइव सर्च</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('directory');
                  setGenerationError(null);
                }}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hidden md:flex items-center gap-1.5 ${
                  activeTab === 'directory'
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>पोर्टल डायरेक्टरी</span>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Output Language Selector */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081228] border border-blue-950 text-xs">
            <span className="text-slate-400 font-medium">उत्तर की भाषा (Language):</span>
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
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-blue-950/80'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: URL READER & ANALYZER */}
          {activeTab === 'url_reader' && (
            <div className="space-y-4">
              {/* URL Input Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchPage();
                    }}
                    placeholder="वेबसाइट या लेख का लिंक डालें (e.g. https://en.wikipedia.org/wiki/India)"
                    className="w-full bg-[#050917] border border-blue-900/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleFetchPage()}
                  disabled={isLoadingPage || !urlInput.trim()}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-cyan-600/30"
                >
                  {isLoadingPage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  <span>वेबपेज ब्राउज़ करें</span>
                </button>
              </div>

              {pageError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                  {pageError}
                </div>
              )}

              {/* Loaded Page Preview Card */}
              {pageData && (
                <div className="p-4 rounded-2xl bg-[#08122a] border border-cyan-900/60 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={pageData.favicon}
                        alt="favicon"
                        className="w-6 h-6 rounded-md bg-white p-0.5 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                          {pageData.domain}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">
                          {pageData.title}
                        </h3>
                      </div>
                    </div>

                    <a
                      href={pageData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 shrink-0 underline underline-offset-2"
                    >
                      मूल साइट खोलें
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {pageData.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {pageData.description}
                    </p>
                  )}

                  {/* Custom question on this page */}
                  <div className="pt-2 border-t border-blue-950/80 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="इस पेज के बारे में कोई विशेष सवाल पूछें (वैकल्पिक)..."
                      className="flex-1 bg-[#050917] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleAnalyzePage('qa')}
                      disabled={isGenerating || !userQuery.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>उत्तर प्राप्त करें</span>
                    </button>
                  </div>

                  {/* Quick AI Action Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleAnalyzePage('summarize')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>संपूर्ण सारांश (Executive Summary)</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzePage('key_facts')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>मुख्य तथ्य व आंकड़े (Fact Sheet)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Links Helper */}
              {!pageData && (
                <div className="p-4 rounded-2xl bg-[#060c1d] border border-blue-950 text-xs text-slate-400 space-y-2">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Mera AI ब्राउज़िंग सिस्टम से आप क्या-क्या कर सकते हैं:</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                    <li>किसी भी समाचार लेख या ब्लॉग पोस्ट का हिंदी में त्वरित सारांश पढ़ें</li>
                    <li>विकिपीडिया व आधिकारिक दस्तावेज़ीकरण का गहन विश्लेषण करें</li>
                    <li>पेज की सामग्री के आधार पर किसी भी जटिल विषय पर सीधे सवाल पूछें</li>
                    <li>वेबसाइट के तथ्य, आंकड़े और तारीखें बिना विज्ञापन के निकालें</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE WEB SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchWeb();
                    }}
                    placeholder="ताज़ा समाचार, खेल स्कोर, तकनीकी अपडेट या कोई भी सवाल खोजें..."
                    className="w-full bg-[#050917] border border-blue-900/80 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleSearchWeb()}
                  disabled={isGenerating || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-blue-600/30"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>वेब पर खोजें</span>
                </button>
              </div>

              {/* Popular quick topics */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  लोकप्रिय ट्रेंडिंग विषय (Click to Search):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'भारत में ताज़ा मुख्य समाचार',
                    'क्रिकेट मैच स्कोर व आगामी मैच',
                    '2026 के टॉप AI टूल्स',
                    'सोने और चांदी का आज का भाव भारत में',
                    'ISRO के हालिया और आगामी अंतरिक्ष मिशन',
                  ].map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(topic);
                        handleSearchWeb(topic);
                      }}
                      className="px-2.5 py-1 text-xs bg-[#09132b] hover:bg-[#0c1a3b] border border-blue-900/70 hover:border-cyan-500/60 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTAL DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>सत्यापित भारतीय सरकारी व प्रमुख सार्वजनिक पोर्टल:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleDirectory.map((portal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#08122a] border border-blue-950 flex flex-col justify-between gap-2 group hover:border-cyan-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {portal.name}
                        </span>
                        <a
                          href={portal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          खोलें <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {portal.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUrlInput(portal.url);
                        setActiveTab('url_reader');
                        handleFetchPage(portal.url);
                      }}
                      className="self-start text-[11px] font-semibold text-cyan-400 hover:text-cyan-200 transition-colors"
                    >
                      इस पोर्टल का सारांश पढ़ें →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="p-8 rounded-2xl bg-[#050a1a] border border-cyan-900/50 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-3 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <Globe className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Mera AI वेब ब्राउज़िंग सिस्टम विश्लेषण कर रहा है...
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                इंटरनेट से तथ्य पढ़े जा रहे हैं और निष्पक्ष रिपोर्ट तैयार की जा रही है
              </p>
            </div>
          )}

          {/* Generation Error */}
          {generationError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-200">
              <div className="font-semibold mb-1">त्रुटि:</div>
              <div>{generationError}</div>
            </div>
          )}

          {/* Results Display */}
          {generatedResult && !isGenerating && (
            <div className="rounded-2xl bg-[#050a1a] border border-cyan-900/70 overflow-hidden shadow-xl animate-in fade-in duration-150">
              <div className="px-4 py-2.5 bg-blue-950/70 border-b border-blue-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>वेब ब्राउज़िंग रिपोर्ट (Web Intelligence Report)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">कॉपी हुआ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>कॉपी करें</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportToChat}
                    className="px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>चैट में जारी रखें</span>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200 leading-relaxed overflow-x-auto selection:bg-cyan-500 selection:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedResult}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-blue-950 bg-[#050a19] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>लाइव वेब क्रॉलर व Google Search ग्राउंडिंग सक्रिय</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
