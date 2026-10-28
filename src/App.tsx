/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { FutureFeaturesModal } from './components/FutureFeaturesModal.tsx';
import { YouTubeStudioModal } from './components/YouTubeStudioModal.tsx';
import { WhatsAppShareModal } from './components/WhatsAppShareModal.tsx';
import { WebBrowsingModal } from './components/WebBrowsingModal.tsx';
import { AndroidAppGuideModal } from './components/AndroidAppGuideModal.tsx';
import { generateLocalAiResponse } from './utils/localAiEngine.ts';
import {
  Conversation,
  ChatMessage as ChatMessageType,
  PersonaKey,
  LanguagePreference,
  AttachedFile,
  WebSource,
} from './types.ts';
import { PERSONAS } from './constants.ts';

const STORAGE_KEY_CONVERSATIONS = 'mera_ai_conversations_v5';
const STORAGE_KEY_PERSONA = 'mera_ai_persona';
const STORAGE_KEY_LANG = 'mera_ai_lang';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [currentPersona, setCurrentPersona] = useState<PersonaKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
      return (saved as PersonaKey) || 'general';
    } catch {
      return 'general';
    }
  });

  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      return (saved as LanguagePreference) || 'auto';
    } catch {
      return 'auto';
    }
  });

  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFutureFeaturesOpen, setIsFutureFeaturesOpen] = useState(false);
  const [isYouTubeStudioOpen, setIsYouTubeStudioOpen] = useState(false);
  const [isWhatsAppShareOpen, setIsWhatsAppShareOpen] = useState(false);
  const [isWebBrowsingOpen, setIsWebBrowsingOpen] = useState(false);
  const [webBrowsingInitialUrl, setWebBrowsingInitialUrl] = useState<string>('');
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [shareTargetMessage, setShareTargetMessage] = useState<ChatMessageType | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [conversations]);

  // Sync preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERSONA, currentPersona);
  }, [currentPersona]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, languagePreference);
  }, [languagePreference]);

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isStreaming]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversation?.messages || [];

  // Start fresh chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveConversationId(null);
  };

  // Select existing chat
  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentPersona(conv.persona);
    }
  };

  // Delete chat
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  // Rename chat
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Clear all chats
  const handleClearAll = () => {
    setConversations([]);
    setActiveConversationId(null);
  };

  // Export current conversation to .txt file
  const handleExportTxt = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;

    const dateStr = new Date(activeConversation.createdAt || Date.now()).toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let textContent = `====================================================================\n`;
    textContent += `MERA AI - बातचीत का विवरण (Conversation Export)\n`;
    textContent += `शीर्षक: ${activeConversation.title}\n`;
    textContent += `दिनांक: ${dateStr}\n`;
    textContent += `मोड: ${PERSONAS[activeConversation.persona]?.hindiName || 'सर्वज्ञानी'}\n`;
    textContent += `कुल संदेश: ${activeConversation.messages.length}\n`;
    textContent += `====================================================================\n\n`;

    for (const msg of activeConversation.messages) {
      const sender = msg.role === 'user' ? 'आप (User)' : 'Mera AI';
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      textContent += `[${sender}] - ${time}\n`;
      if (msg.attachment) {
        textContent += `[संलग्न फ़ाइल: ${msg.attachment.name} (${msg.attachment.isPdf ? 'PDF' : 'Photo'})]\n`;
      }
      textContent += `${msg.content}\n`;

      if (msg.sources && msg.sources.length > 0) {
        textContent += `\nस्रोत व संदर्भ (Web Sources):\n`;
        for (const s of msg.sources) {
          textContent += `  • ${s.title}: ${s.uri}\n`;
        }
      }
      textContent += `\n--------------------------------------------------------------------\n\n`;
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (activeConversation.title || 'chat').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_').slice(0, 30);
    a.download = `Mera_AI_${safeTitle}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Continue YouTube Studio result inside Mera AI chat
  const handleSendFromYouTubeStudio = (content: string, title?: string) => {
    const convTitle = title ? `यूट्यूब: ${title.slice(0, 26)}...` : 'यूट्यूब विश्लेषण';
    const newMsg: ChatMessageType = {
      id: `yt_msg_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };

    if (!activeConversationId) {
      const newConvId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: convTitle,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        persona: 'youtube_song',
        messages: [newMsg],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConvId);
      setCurrentPersona('youtube_song');
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, newMsg],
              }
            : c
        )
      );
    }
  };

  // Open WhatsApp share modal with optional specific message
  const handleOpenWhatsAppShare = (specificMsg?: ChatMessageType) => {
    setShareTargetMessage(specificMsg || null);
    setIsWhatsAppShareOpen(true);
  };

  // Continue Web Browsing result inside Mera AI chat
  const handleSendFromWebBrowsing = (content: string, title?: string) => {
    const convTitle = title ? `वेब: ${title.slice(0, 26)}...` : 'वेब ब्राउज़िंग रिपोर्ट';
    const newMsg: ChatMessageType = {
      id: `web_msg_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };

    if (!activeConversationId) {
      const newConvId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: convTitle,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        persona: 'general',
        messages: [newMsg],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConvId);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, newMsg],
              }
            : c
        )
      );
    }
  };

  // Open Web Browsing modal with optional target URL
  const handleOpenWebBrowsing = (url?: string) => {
    setWebBrowsingInitialUrl(url || '');
    setIsWebBrowsingOpen(true);
  };

  // Stop current request
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          const updated = [...c.messages];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              isStreaming: false,
              content: updated[lastIdx].content || 'उत्तर रोक दिया गया।',
            };
          }
          return { ...c, messages: updated };
        })
      );
    }
  };

  // Progressive typing effect for clean UI feedback
  const animateTextDelivery = (
    convId: string,
    messageId: string,
    fullText: string,
    sources?: WebSource[],
    searchQueries?: string[]
  ): Promise<void> => {
    return new Promise((resolve) => {
      const tokens = fullText.split(/(\s+)/);
      let currentOutput = '';
      let index = 0;

      const intervalMs = Math.max(10, Math.min(30, 800 / tokens.length));

      const interval = setInterval(() => {
        if (index >= tokens.length) {
          clearInterval(interval);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        content: fullText,
                        sources: sources || [],
                        searchQueries: searchQueries || [],
                        isStreaming: false,
                        error: false,
                      }
                    : m
                ),
              };
            })
          );
          resolve();
          return;
        }

        currentOutput += tokens[index];
        index++;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content: currentOutput, isStreaming: true }
                  : m
              ),
            };
          })
        );
      }, intervalMs);
    });
  };

  // Send message to Gemini API with robust try/catch/finally
  const handleSendMessage = async (
    content: string,
    attachment?: AttachedFile,
    options?: { forceWebSearch?: boolean }
  ) => {
    if (isStreaming) return;

    let convId = activeConversationId;
    let targetPersona = currentPersona;
    const shouldUseWebSearch =
      options?.forceWebSearch !== undefined ? options.forceWebSearch : enableWebSearch;

    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachment,
    };

    const assistantMessageId = `msg_ai_${Date.now() + 1}`;
    const initialAssistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      error: false,
    };

    let updatedConversationList: Conversation[];

    if (!convId) {
      convId = `conv_${Date.now()}`;
      setActiveConversationId(convId);

      const title =
        content.slice(0, 32) || (attachment ? attachment.name : 'नई बातचीत');

      const newConv: Conversation = {
        id: convId,
        title,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        messages: [userMessage, initialAssistantMessage],
        persona: targetPersona,
      };

      updatedConversationList = [newConv, ...conversations];
      setConversations(updatedConversationList);
    } else {
      const existingConv = conversations.find((c) => c.id === convId);
      if (existingConv) {
        targetPersona = existingConv.persona;
      }

      updatedConversationList = conversations.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          updatedAt: Date.now(),
          messages: [...c.messages, userMessage, initialAssistantMessage],
        };
      });
      setConversations(updatedConversationList);
    }

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 35000);

    try {
      const currentConv = updatedConversationList.find((c) => c.id === convId);
      const historyToSend = (currentConv ? currentConv.messages.slice(0, -1) : [userMessage])
        .filter((m) => m.content?.trim() || m.attachment)
        .map((m) => ({
          role: m.role,
          content: m.content,
          attachment: m.attachment
            ? {
                mimeType: m.attachment.mimeType,
                data: m.attachment.data,
                name: m.attachment.name,
              }
            : undefined,
        }));

      const payload = {
        messages: historyToSend,
        persona: targetPersona,
        languagePreference,
        enableWebSearch: shouldUseWebSearch,
      };

      // Check offline mode or disconnected network
      if ((typeof navigator !== 'undefined' && !navigator.onLine) || !isOnline) {
        clearTimeout(timeoutId);
        const localReply = await generateLocalAiResponse(
          content,
          historyToSend,
          languagePreference,
          (chunk) => {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== convId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: chunk, isStreaming: true }
                      : m
                  ),
                };
              })
            );
          }
        );

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: localReply, isStreaming: false }
                  : m
              ),
            };
          })
        );
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.userMessage ||
          errorData.error ||
          `सर्वर त्रुटि: कोड ${response.status}`;
        const errorType =
          errorData.errorType ||
          (response.status === 429 ? 'SEARCH_QUOTA_EXHAUSTED' : 'GENERAL_ERROR');
        const canRetry = errorData.canRetry ?? true;
        const canAskWithoutSearch = errorData.canAskWithoutSearch ?? shouldUseWebSearch;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: errorMessage,
                      isStreaming: false,
                      error: true,
                      errorType,
                      canRetry,
                      canAskWithoutSearch,
                      lastQuery: content,
                    }
                  : m
              ),
            };
          })
        );
        return;
      }

      const data = await response.json();
      const replyText = data.text?.trim() || 'कोई उत्तर प्राप्त नहीं हुआ।';
      const sources: WebSource[] = Array.isArray(data.sources) ? data.sources : [];
      const searchQueries: string[] = Array.isArray(data.searchQueries) ? data.searchQueries : [];

      await animateTextDelivery(convId, assistantMessageId, replyText, sources, searchQueries);
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      const isAborted = (err as Error).name === 'AbortError';

      // If connection failed, seamlessly fall back to Local Offline AI Model!
      if (!isAborted) {
        try {
          const currentConv = updatedConversationList.find((c) => c.id === convId);
          const historyToSend = (currentConv ? currentConv.messages.slice(0, -1) : [])
            .map((m) => ({ role: m.role, content: m.content }));
          const localFallback = await generateLocalAiResponse(
            content,
            historyToSend,
            languagePreference
          );
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: localFallback,
                        isStreaming: false,
                        error: false,
                      }
                    : m
                ),
              };
            })
          );
          return;
        } catch {
          // Proceed to standard error state below
        }
      }

      const errorMessage = isAborted
        ? 'अनुरोध समय समाप्त (Request Timeout) हो गया। कृपया पुनः प्रयास करें।'
        : 'नेटवर्क कनेक्शन में समस्या आई। कृपया पुनः प्रयास करें।';

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: errorMessage,
                    isStreaming: false,
                    error: true,
                    errorType: 'GENERAL_ERROR',
                    canRetry: true,
                    canAskWithoutSearch: shouldUseWebSearch,
                    lastQuery: content,
                  }
                : m
            ),
          };
        })
      );
    } finally {
      clearTimeout(timeoutId);
      setIsStreaming(false);
      abortControllerRef.current = null;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, isStreaming: false }
                : m
            ),
          };
        })
      );
    }
  };

  // Retry with Web Search explicitly enabled
  const handleRetrySearch = (query?: string) => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    const lastAssistant = msgs[msgs.length - 1];
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
    const targetQuery = query || lastAssistant?.lastQuery || lastUser?.content || '';
    const targetAttachment = lastUser?.attachment;

    if (!targetQuery && !targetAttachment) return;

    // Remove the failed assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.filter((m) => m.id !== lastAssistant?.id),
        };
      })
    );

    setEnableWebSearch(true);
    handleSendMessage(targetQuery, targetAttachment, { forceWebSearch: true });
  };

  // Ask without Search directly
  const handleAskWithoutSearch = (query?: string) => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    const lastAssistant = msgs[msgs.length - 1];
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
    const targetQuery = query || lastAssistant?.lastQuery || lastUser?.content || '';
    const targetAttachment = lastUser?.attachment;

    if (!targetQuery && !targetAttachment) return;

    // Remove the failed assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.filter((m) => m.id !== lastAssistant?.id),
        };
      })
    );

    setEnableWebSearch(false);
    handleSendMessage(targetQuery, targetAttachment, { forceWebSearch: false });
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const msgs = activeConversation.messages;
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');

    if (!lastUserMsg) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        const filtered = c.messages.filter((_, idx) => idx !== c.messages.length - 1);
        return { ...c, messages: filtered };
      })
    );

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachment);
  };

  // Text to Speech playback
  const handlePlayAudio = (text: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/```[\s\S]*?```/g, ' कोड ब्लॉक ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[#*_~\[\]]/g, '')
        .slice(0, 500);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();

      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.name.includes('Hindi'));
      const indianVoice = voices.find((v) => v.lang.includes('IN'));

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.lang = 'en-IN';
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      setPlayingAudioId(messageId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('आपके ब्राउज़र में आवाज़ स्पीच उपलब्ध नहीं है।');
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudioId(null);
  };

  const currentPersonaInfo = PERSONAS[currentPersona] || PERSONAS.general;

  return (
    <div className="flex h-screen w-screen bg-[#030712] text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar (History & Personas) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        currentPersona={currentPersona}
        onOpenYouTubeStudio={() => setIsYouTubeStudioOpen(true)}
        onOpenWebBrowsing={() => handleOpenWebBrowsing()}
        onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
        isOnline={isOnline}
        onSelectPersona={(p) => {
          setCurrentPersona(p);
          if (activeConversationId) {
            setConversations((prev) =>
              prev.map((c) => (c.id === activeConversationId ? { ...c, persona: p } : c))
            );
          }
        }}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#030712] relative">
        {/* Top Header */}
        <Header
          currentPersona={currentPersona}
          onSelectPersona={(p) => {
            setCurrentPersona(p);
            if (activeConversationId) {
              setConversations((prev) =>
                prev.map((c) => (c.id === activeConversationId ? { ...c, persona: p } : c))
              );
            }
          }}
          languagePreference={languagePreference}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenYouTubeStudio={() => setIsYouTubeStudioOpen(true)}
          onOpenWebBrowsing={() => handleOpenWebBrowsing()}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          isOnline={isOnline}
          onOpenWhatsAppShare={() => handleOpenWhatsAppShare()}
          onExportTxt={handleExportTxt}
          canExport={activeMessages.length > 0}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Chat Feed or Welcome Screen */}
        {activeMessages.length === 0 ? (
          <WelcomeScreen
            currentPersona={currentPersona}
            onSelectPersona={setCurrentPersona}
            languagePreference={languagePreference}
            onSelectLanguage={setLanguagePreference}
            onSelectPrompt={(prompt, personaTarget) => {
              if (personaTarget) {
                setCurrentPersona(personaTarget);
              }
              handleSendMessage(prompt);
            }}
            onOpenFutureFeatures={() => setIsFutureFeaturesOpen(false)}
            onOpenYouTubeStudio={() => setIsYouTubeStudioOpen(true)}
            onOpenWebBrowsing={() => handleOpenWebBrowsing()}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-blue-950/20">
            {activeMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined}
                onRetrySearch={handleRetrySearch}
                onAskWithoutSearch={handleAskWithoutSearch}
                onShareWhatsApp={(m) => handleOpenWhatsAppShare(m)}
                onOpenWebBrowsing={handleOpenWebBrowsing}
                isPlayingAudio={playingAudioId === msg.id}
                onPlayAudio={(text) => handlePlayAudio(text, msg.id)}
                onStopAudio={handleStopAudio}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Bottom Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          enableWebSearch={enableWebSearch}
          onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
          onOpenFutureFeatures={() => setIsFutureFeaturesOpen(true)}
          onOpenYouTubeStudio={() => setIsYouTubeStudioOpen(true)}
          onOpenWebBrowsing={() => handleOpenWebBrowsing()}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          isOnline={isOnline}
          placeholder={currentPersonaInfo.placeholder}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        languagePreference={languagePreference}
        onSelectLanguage={setLanguagePreference}
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        conversations={conversations}
        onClearAll={handleClearAll}
      />

      {/* Future Roadmap & Paid Key Info Modal */}
      <FutureFeaturesModal
        isOpen={isFutureFeaturesOpen}
        onClose={() => setIsFutureFeaturesOpen(false)}
      />

      {/* YouTube Studio Modal */}
      <YouTubeStudioModal
        isOpen={isYouTubeStudioOpen}
        onClose={() => setIsYouTubeStudioOpen(false)}
        onSendToChat={handleSendFromYouTubeStudio}
        defaultLanguage={languagePreference}
      />

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppShareOpen}
        onClose={() => {
          setIsWhatsAppShareOpen(false);
          setShareTargetMessage(null);
        }}
        conversation={activeConversation || null}
        initialMessage={shareTargetMessage}
      />

      {/* Web Browsing Modal */}
      <WebBrowsingModal
        isOpen={isWebBrowsingOpen}
        onClose={() => {
          setIsWebBrowsingOpen(false);
          setWebBrowsingInitialUrl('');
        }}
        onSendToChat={handleSendFromWebBrowsing}
        defaultLanguage={languagePreference}
        initialUrl={webBrowsingInitialUrl}
      />

      {/* Android App & APK Guide Modal */}
      <AndroidAppGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
      />
    </div>
  );
}
