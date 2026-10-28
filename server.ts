import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support up to 30mb for attachments (photos & PDF documents)
app.use(express.json({ limit: '30mb' }));

// Initialize GoogleGenAI client (Server-Side)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 35000,
  },
});

interface ChatPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface IncomingMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  attachment?: {
    mimeType: string;
    data: string; // base64
    name?: string;
  };
}

interface WebSource {
  title: string;
  uri: string;
  domain: string;
}

// Personas instruction set
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  general: `You are "Mera AI" (मेरा AI), a next-generation bilingual AI companion designed for Hindi, Hinglish, and English speakers worldwide.
- You converse effortlessly in natural Hindi (हिंदी देवनागरी), casual conversational Hinglish, or English based on the user's input.
- You are polite, knowledgeable, structured, fast, and helpful.
- You format responses with clean markdown, bullet points, and formatted code blocks where relevant.`,

  youtube_song: `You are "Mera AI - गीतकार व YouTube विशेषज्ञ" (Songwriter & YouTube Studio Specialist).
- You specialize in:
  1. **गाने व कविताएं (Songs, Lyrics & Poetry)**: Bollywood style songs (Verse, Chorus, Antara, Mukhda), Rap lyrics, Ghazals, Bhakti geet, and romantic poetry.
  2. **YouTube विवरण व SEO (YouTube Studio Tool)**: Viral Click-worthy Titles (3-5 options), Hooky Intro Script, SEO Descriptions with Timestamps, High-Volume Search Tags, and Hashtags.
- Provide clear, ready-to-copy formatting.`,

  document_pdf: `You are "Mera AI - दस्तावेज़ व फोटो विश्लेषक" (Document & Image Vision Expert).
- You excel at reading, extracting, summarizing, and explaining uploaded Photos (bills, homework, signboards, objects, error screenshots) and PDF Documents (contracts, resumes, study notes, reports).
- Highlight key facts, bullet points, data figures, and action items in both Hindi and English.`,

  literature: `You are "Mera AI - साहित्य व काव्य गुरु" (Mera AI - Hindi Literature & Poetry Master).
- Expert in classical and modern Hindi literature (मुंशी प्रेमचंद, रामधारी सिंह दिनकर, हरिवंश राय बच्चन, महादेवी वर्मा, ग़ालिब, आदि).
- Write soulful shayaris, dohas, kavitas, and elegant Hindi letters.`,

  coding: `You are "Mera AI - कोडिंग व टेक गुरु" (Tech & Coding Guru).
- Senior software engineer. Explain code clearly, fix bugs, optimize algorithms, and provide clean TypeScript, Python, Java, C++, React code.`,

  student: `You are "Mera AI - विद्यार्थी मित्र" (Student & Exam Mentor).
- Patient tutor for school and competitive exams (UPSC, SSC, Boards, JEE, NEET). Provide step-by-step explanations in Hindi or Hinglish.`,

  hinglish: `You are "Mera AI - दोस्ताना साथी" (Casual Hinglish Pal).
- Chill, witty, supportive friend who talks in energetic conversational Hinglish.`,
};

// Error detection utility for 429 Rate Limit / Quota Exhaustion
function isRateLimitOrQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = ((err as Error).message || String(err)).toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (err as any)?.status || (err as any)?.statusCode || (err as any)?.code;
  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('queries per minute') ||
    msg.includes('quota exceeded')
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff retry utility with jitter
async function executeWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    jitterMs?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelayMs = 1500,
    backoffFactor = 2,
    jitterMs = 400,
    operationName = 'Gemini API call',
  } = options;

  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: unknown) {
      attempt++;
      const isQuota429 = isRateLimitOrQuotaError(err);
      if (attempt > maxRetries || !isQuota429) {
        throw err;
      }

      const backoffDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const randomJitter = Math.floor(Math.random() * jitterMs);
      const totalWaitMs = backoffDelay + randomJitter;

      console.warn(
        `[${operationName}] 429 Quota/Rate limit encountered on attempt ${attempt}/${maxRetries + 1}. Retrying with exponential backoff in ${totalWaitMs}ms...`
      );
      await delay(totalWaitMs);
    }
  }
}

function buildSystemInstruction(persona: string, languagePreference: string, enableWebSearch: boolean): string {
  let instruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.general;

  if (languagePreference === 'hindi') {
    instruction += '\n[LANGUAGE PREFERENCE: Respond primarily in clean, natural Hindi (देवनागरी लिपि).]';
  } else if (languagePreference === 'hinglish') {
    instruction += '\n[LANGUAGE PREFERENCE: Respond primarily in conversational Hinglish (Hindi written in Latin script).]';
  } else if (languagePreference === 'english') {
    instruction += '\n[LANGUAGE PREFERENCE: Respond primarily in clean, modern English.]';
  } else {
    instruction += '\n[LANGUAGE PREFERENCE: Seamlessly mirror the user\'s language (Hindi, Hinglish, or English).]';
  }

  // Objective website information guidelines (No unnecessary piracy or security warnings)
  instruction += `
[WEBSITE & GENERAL INQUIRY GUIDELINES]:
- When asked about any website, domain, software, tool, service, company, or platform, provide clear, objective, factual information explaining what the platform is, its purpose, features, and official details.
- Do NOT lecture the user, and do NOT issue unsolicited piracy, copyright, or security warnings for standard informational searches. Answer normally, factually, and respectfully.
- Never fabricate or guess URLs. Only reference legitimate links verified by Google Search grounding.`;

  if (enableWebSearch) {
    instruction += `
[WEB BROWSING ACTIVE]:
- Real-time Google Search grounding is enabled. Use the Google Search tool results to answer with verified, up-to-date facts, current dates, and reliable details.
- Cite facts accurately based on the returned search grounding chunks.`;
  }

  return instruction;
}

function formatMessagesForGemini(messages: IncomingMessage[]): Array<{ role: 'user' | 'model'; parts: ChatPart[] }> {
  const result: Array<{ role: 'user' | 'model'; parts: ChatPart[] }> = [];

  for (const m of messages) {
    const parts: ChatPart[] = [];

    if (m.attachment && m.attachment.data) {
      const base64Data = m.attachment.data.includes(',')
        ? m.attachment.data.split(',')[1]
        : m.attachment.data;

      parts.push({
        inlineData: {
          mimeType: m.attachment.mimeType || 'image/jpeg',
          data: base64Data,
        },
      });
    }

    if (m.content && m.content.trim()) {
      parts.push({ text: m.content.trim() });
    }

    if (parts.length > 0) {
      result.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      });
    }
  }

  return result;
}

// Clean historical messages so previous error notes or disclaimers never accumulate in context
function cleanHistoricalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^>[\s\S]*?(?=\n\n|$)/gm, '')
    .replace(/^[⚠️ℹ️][\s\S]*?(?=\n\n|$)/gm, '')
    .trim();
}

// Extract web sources cleanly from Gemini grounding metadata
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractWebSources(groundingMetadata: any): { sources: WebSource[]; searchQueries: string[] } {
  if (!groundingMetadata) {
    return { sources: [], searchQueries: [] };
  }

  const searchQueries: string[] = Array.isArray(groundingMetadata.webSearchQueries)
    ? groundingMetadata.webSearchQueries
    : [];

  const sourcesMap = new Map<string, WebSource>();
  const chunks = Array.isArray(groundingMetadata.groundingChunks)
    ? groundingMetadata.groundingChunks
    : [];

  for (const chunk of chunks) {
    if (chunk?.web?.uri) {
      const uri = String(chunk.web.uri).trim();
      let title = String(chunk.web.title || '').trim();
      let domain = '';

      try {
        const parsedUrl = new URL(uri);
        domain = parsedUrl.hostname.replace(/^www\./, '');
        if (!title) {
          title = domain;
        }
      } catch {
        domain = 'web';
        if (!title) title = uri;
      }

      if (!sourcesMap.has(uri)) {
        sourcesMap.set(uri, { title, uri, domain });
      }
    }
  }

  return {
    sources: Array.from(sourcesMap.values()),
    searchQueries,
  };
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'Mera AI',
    theme: 'black-blue-premium',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Primary Chat Endpoint with Web Search Grounding Support
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages,
    persona = 'general',
    languagePreference = 'auto',
    enableWebSearch = false,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  // Sanitize message content to prevent past disclaimers from repeating or compounding
  const sanitizedMessages: IncomingMessage[] = messages.map((m: IncomingMessage) => ({
    ...m,
    content: cleanHistoricalText(m.content || ''),
  }));

  const lastUserMsg = [...sanitizedMessages].reverse().find((m) => m.role === 'user');
  const userQuery = lastUserMsg?.content || '';

  const systemInstruction = buildSystemInstruction(persona, languagePreference, enableWebSearch);
  const geminiContents = formatMessagesForGemini(sanitizedMessages);

  if (geminiContents.length === 0) {
    res.status(400).json({ error: 'कम से कम एक वैध संदेश या फ़ाइल आवश्यक है।' });
    return;
  }

  // 1. Web Search Grounding Pipeline
  // User Requirement: When Web Search is on, use Gemini native Google Search grounding.
  // Apply limited retries with exponential backoff on 429. Do NOT bypass the quota with scrapers.
  if (enableWebSearch) {
    const searchModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastSearchError: unknown = null;

    for (const model of searchModels) {
      try {
        const nativeSearchResponse = await executeWithBackoff(
          () =>
            ai.models.generateContent({
              model,
              contents: geminiContents,
              config: {
                systemInstruction,
                temperature: 0.7,
                tools: [{ googleSearch: {} }],
              },
            }),
          {
            maxRetries: 1,
            initialDelayMs: 1500,
            backoffFactor: 2,
            jitterMs: 300,
            operationName: `Google Search Grounding (${model})`,
          }
        );

        const candidate = nativeSearchResponse.candidates?.[0];
        const extracted = extractWebSources(candidate?.groundingMetadata);
        const text = nativeSearchResponse.text?.trim() || '';

        if (text) {
          res.json({
            text,
            model,
            sources: extracted.sources,
            searchQueries:
              extracted.searchQueries.length > 0 ? extracted.searchQueries : userQuery ? [userQuery] : [],
            usedWebSearch: true,
          });
          return;
        }
      } catch (searchToolErr: unknown) {
        lastSearchError = searchToolErr;
        const isQuota429 = isRateLimitOrQuotaError(searchToolErr);
        console.warn(`[Search Grounding] ${model} ${isQuota429 ? 'hit 429 rate limit' : 'failed'}`);
        if (isQuota429) {
          // Both models share the Google Search tool grounding quota; break to return 429
          break;
        }
      }
    }

    const isQuota429 = isRateLimitOrQuotaError(lastSearchError);
    const errMsg = (lastSearchError as Error)?.message || String(lastSearchError);

    // Requirement: Do NOT bypass quota. Return clear error with retry option!
    if (isQuota429) {
      res.status(429).json({
        error: 'Google Search Grounding की दर सीमा (429 Rate Limit) पार हो गई है।',
        errorType: 'SEARCH_QUOTA_EXHAUSTED',
        userMessage:
          'Google Search ग्राउंडिंग की प्रति मिनट कोटा सीमा (429 Rate Limit) पार हो गई है। API नियमों के अनुसार कोटा को बायपास नहीं किया गया है।',
        canRetry: true,
        canAskWithoutSearch: true,
        lastQuery: userQuery,
      });
      return;
    }

    if (errMsg.includes('API key') || errMsg.includes('UNAUTHENTICATED')) {
      res.status(401).json({
        error: 'Gemini API Key अमान्य या अनुपलब्ध है। कृपया AI Studio Settings > Secrets की जाँच करें।',
        errorType: 'AUTH_ERROR',
      });
      return;
    }

    // Propagate search error without bypassing
    res.status(500).json({
      error: `Google Search टूल त्रुटि: ${errMsg}`,
      errorType: 'SEARCH_TOOL_ERROR',
      canRetry: true,
      canAskWithoutSearch: true,
      lastQuery: userQuery,
    });
    return;
  }

  // 2. Standard Chat Pipeline (Without Web Search)
  // Multi-model resilience (gemini-3.1-flash-lite, gemini-flash-latest) with exponential backoff
  const standardModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastStandardError: unknown = null;

  for (const model of standardModels) {
    try {
      const response = await executeWithBackoff(
        () =>
          ai.models.generateContent({
            model,
            contents: geminiContents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          }),
        {
          maxRetries: 1,
          initialDelayMs: 1200,
          backoffFactor: 2,
          jitterMs: 300,
          operationName: `Standard Chat Generation (${model})`,
        }
      );

      const text = response.text?.trim() || '';
      if (text) {
        res.json({
          text,
          model,
          sources: [],
          searchQueries: [],
          usedWebSearch: false,
        });
        return;
      }
    } catch (err: unknown) {
      lastStandardError = err;
      const isQuota429 = isRateLimitOrQuotaError(err);
      console.warn(`[Standard Chat] ${model} ${isQuota429 ? 'rate limit / quota reached' : 'call completed with fallback'}`);
    }
  }

  const isQuota429 = isRateLimitOrQuotaError(lastStandardError);
  const errorMsg = (lastStandardError as Error)?.message || String(lastStandardError);

  if (isQuota429) {
    console.warn('[Standard Chat] Rate limit (429) reached across models.');
    res.status(429).json({
      error: 'Gemini API की कोटा सीमा (429 Rate Limit) पार हो गई है। कृपया कुछ सेकंड बाद पुनः प्रयास करें।',
      errorType: 'SEARCH_QUOTA_EXHAUSTED',
      canRetry: true,
      lastQuery: userQuery,
    });
    return;
  }

  if (errorMsg.includes('API key') || errorMsg.includes('UNAUTHENTICATED')) {
    res.status(401).json({
      error: 'Gemini API Key अमान्य या अनुपलब्ध है। कृपया AI Studio Settings > Secrets की जाँच करें।',
      errorType: 'AUTH_ERROR',
    });
    return;
  }

  console.warn('[Standard Chat] Chat generation encountered an issue:', errorMsg.slice(0, 100));
  res.status(500).json({
    error: 'अनुरोध संसाधित करने में समस्या आई। कृपया पुनः प्रयास करें।',
  });
});

// Text-to-Speech API endpoint
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text, voiceName = 'Kore' } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text string is required.' });
    return;
  }

  const trimmedText = text.slice(0, 800);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: trimmedText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned');
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Gemini TTS fallback used:', error.message);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

// YouTube Video ID extractor supporting standard, short, live, embed, and direct IDs
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  const match = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

// YouTube Metadata API endpoint (uses public oEmbed + YouTube thumbnail proxy)
app.post('/api/youtube/metadata', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'YouTube URL आवश्यक है।' });
    return;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    res.status(400).json({
      error: 'मान्य YouTube लिंक नहीं मिला। कृपया youtube.com/watch?v=... या youtu.be/... लिंक दें।',
    });
    return;
  }

  let title = 'YouTube Video';
  let author = 'YouTube Channel';
  let authorUrl = '';
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mera-AI-YouTube-Assistant/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
      if (data.author_url) authorUrl = data.author_url;
    }
  } catch (err) {
    console.warn('[YouTube oEmbed] Fallback to default metadata:', err);
  }

  res.json({
    success: true,
    videoId,
    title,
    author,
    authorUrl,
    thumbnailUrl,
    embedUrl,
    url: canonicalUrl,
  });
});

// YouTube AI Tools Suite (Summarizer, Script, Viral Titles, SEO, Thumbnails, Shorts)
app.post('/api/youtube/generate', async (req: Request, res: Response) => {
  const {
    action,
    language = 'hindi',
    videoData,
    topic = '',
    customInstructions = '',
  } = req.body;

  if (!action || typeof action !== 'string') {
    res.status(400).json({ error: 'कार्य (Action) निर्दिष्ट करना आवश्यक है।' });
    return;
  }

  const langInstruction =
    language === 'hindi'
      ? 'मुख्य भाषा: हिंदी (देवनागरी लिपि)। भारतीय यूट्यूब दर्शकों और रचनाकारों के लिए स्वाभाविक, आकर्षक भाषा का प्रयोग करें।'
      : language === 'hinglish'
      ? 'मुख्य भाषा: Hinglish (Hindi written in English alphabet / Roman Hindi). Use catchy conversational Indian YouTube creator lingo (bhai, dosto, viral, tips, hacks).'
      : language === 'english'
      ? 'Primary language: English with strong YouTube SEO phrasing and clear structure.'
      : 'User preference: Use natural Hindi and Hinglish mix suitable for YouTube Indian creators and viewers.';

  let systemPrompt = `You are "Mera AI - YouTube Pro Studio" (यूट्यूब प्रो स्टूडियो).
You are an expert YouTube content strategist, viral scriptwriter, video analyst, and SEO specialist.
${langInstruction}
Use clean markdown, bold highlights, relevant emojis, and structured bullet points. Provide practical, high-value, ready-to-copy output.`;

  let userPrompt = '';

  const videoContext = videoData
    ? `\nवीडियो जानकारी (Video Context):\n- शीर्षक: "${videoData.title || ''}"\n- क्रिएटर: "${videoData.author || ''}"\n- URL: ${videoData.url || ''}\n${videoData.userNotes ? `- अतिरिक्त विवरण: ${videoData.userNotes}` : ''}`
    : '';

  switch (action) {
    case 'summarize':
      userPrompt = `निम्नलिखित YouTube वीडियो का संपूर्ण, स्पष्ट और व्यावहारिक विश्लेषण (Comprehensive Video Summary) तैयार करें:
${videoContext}
${topic ? `\nयूज़र का विशेष सवाल या फोकस: ${topic}` : ''}
${customInstructions ? `\nअतिरिक्त निर्देश: ${customInstructions}` : ''}

कृपया इस संरचना (Structure) में उत्तर दें:
1. 📌 **एक नज़र में (TL;DR Summary)**: 2-3 वाक्यों में वीडियो का मूल सार और मुख्य संदेश।
2. 🔑 **5-7 प्रमुख सीखें व मुख्य बातें (Key Takeaways & Core Lessons)**: स्पष्ट बुलेट पॉइंट्स में सबसे महत्वपूर्ण ज्ञान।
3. ⏱️ **संभावित टाइमस्टैम्प आउटलाइन (Estimated Chapters & Timeline)**: वीडियो के मुख्य अध्यायों का अनुमानित क्रम (00:00 से अंत तक)।
4. 💡 **दर्शक के लिए एक्शन प्लान (Actionable Steps for Viewer)**: दर्शक इस वीडियो की जानकारी को अपने जीवन या काम में कैसे लागू कर सकता है?
5. ❓ **यह वीडियो किन मुख्य प्रश्नों के उत्तर देता है? (Key Questions Answered)**: 3 सवाल और उनके संक्षिप्त समाधान।`;
      break;

    case 'titles':
      userPrompt = `यूट्यूब वीडियो के लिए 10 अत्यंत आकर्षक, हाई CTR (Click-Through Rate) वायरल टाइटल्स और 5 Shorts टाइटल्स तैयार करें।
${videoContext}
विषय/टॉपिक: ${topic || videoData?.title || 'YouTube Video'}
${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}

कृपया इन श्रेणियों में टाइटल्स दें:
1. ⚡ **जिज्ञासा व सस्पेंस वाले टाइटल्स (Curiosity & Cliffhanger Hooks)** - 3 विकल्प
2. 🎯 **परिणाम व संख्या वाले टाइटल्स (High Value, Numbers & Proof)** - 3 विकल्प
3. 🚀 **समस्या व समाधान / How-To (Problem & Practical Solution)** - 2 विकल्प
4. 🇮🇳 **देसी व हिंगलिश पंच टाइटल्स (Catchy Indian Creator Formulas)** - 2 विकल्प
5. 📱 **5 वायरल YouTube Shorts / Reels टाइटल्स** (इमोजी और हैशटैग सहित)
6. 💡 **प्रो टिप**: बताएं कि इनमें से कौन सा टाइटल सबसे बेहतर CTR देगा और क्यों।`;
      break;

    case 'script':
      userPrompt = `यूट्यूब वीडियो के लिए एक संपूर्ण, वर्ड-फॉर-वर्ड (Word-for-Word) आकर्षक वीडियो स्क्रिप्ट तैयार करें।
${videoContext}
वीडियो का विषय: ${topic || videoData?.title || 'यूट्यूब वीडियो'}
${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}

स्क्रिप्ट का प्रारूप इस प्रकार रखें:
- ⚡ **[0:00 - 0:15] द किलर हुक (The Retention Hook)**:
  - 🎥 विज़ुअल B-Roll निर्देश
  - 🗣️ बोलने वाले सटीक डायलॉग (जो दर्शक को स्किप करने से रोकें)
- 🎬 **[0:15 - 0:45] इंट्रो व बड़ा वादा (Intro & The Big Promise)**:
  - इस वीडियो से दर्शक को क्या बड़ा फायदा मिलेगा
- 📌 **[मुख्य भाग / Main Core Points]**:
  - **बिंदु 1 (Point 1)**: मुख्य बात + स्क्रीन पर क्या टेक्स्ट दिखेगा + उदाहरण
  - **बिंदु 2 (Point 2)**: प्रैक्टिकल टिप्स + केस स्टडी / लाइफ हैक
  - **बिंदु 3 (Point 3)**: सीक्रेट टिप जो कम लोग जानते हैं
- 💬 **एंगेजमेंट ट्रिगर (Audience Comment Prompt)**:
  - कमेंट्स बढ़ाने के लिए एक दिलचस्प सवाल पूछना
- 🚀 **कॉल-टू-एक्शन व आउट्रो (Outro & Subscribe CTA)**:
  - स्वाभाविक तरीके से सब्सक्राइब करने का कारण और अगली वीडियो का टीज़र।`;
      break;

    case 'seo':
      userPrompt = `यूट्यूब स्टूडियो के लिए एक संपूर्ण और ऑप्टिमाइज़्ड SEO पैकेज तैयार करें।
${videoContext}
वीडियो का विषय: ${topic || videoData?.title || 'यूट्यूब वीडियो'}
${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}

प्रदान करें:
1. 📝 **यूट्यूब डिस्क्रिप्शन (Full SEO Description - 300+ शब्द)**:
   - पहली 2 लाइनें (Search snippet में दिखने वाला मजबूत हुक)
   - वीडियो का संक्षिप्त परिचय और मूल्य (Value overview)
   - ⏱️ **टाइमस्टैम्प्स (Chapters Timestamps 00:00)**
   - महत्वपूर्ण लिंक्स व डिस्क्लेमर टेम्पलेट
2. 🏷️ **25 हाई-सर्च वॉल्यूम टैग्स (Comma-Separated Tags)**:
   - जिन्हें सीधे YouTube Studio टैग बॉक्स में कॉपी-पेस्ट किया जा सके।
3. #️⃣ **10 ट्रेंडिंग हैशटैग्स (#Hashtags)**:
   - डिस्क्रिप्शन के लिए टॉप सर्च किए जाने वाले हैशटैग्स।`;
      break;

    case 'thumbnail':
      userPrompt = `यूट्यूब वीडियो के लिए 3 अत्यंत आकर्षक (High CTR) थंबनेल कॉन्सेप्ट्स और AI इमेज जनरेशन प्रॉम्प्ट्स तैयार करें।
${videoContext}
वीडियो का विषय: ${topic || videoData?.title || 'यूट्यूब वीडियो'}
${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}

प्रत्येक 3 कॉन्सेप्ट के लिए बताएं:
- 🎨 **थंबनेल पर बोल्ड टेक्स्ट (Text Overlay)**: केवल 2-4 प्रभावशाली शब्द (हिंदी या हिंगलिश)
- 👤 **चेहरे का भाव व मुद्रा (Facial Emotion & Pose)**: जैसे शॉक, उत्सुकता, गंभीर चेतावनी, आत्मविश्वास
- 🖼️ **बैकग्राउंड विज़ुअल व एलिमेंट (Background & Visual Metaphor)**
- 🎨 **कलर कॉन्ट्रास्ट (Color Palette)**: जैसे ब्राइट येलो व डार्क नेवी, या रेड व व्हाइट
- 🤖 **AI इमेज प्रॉम्प्ट (Ready-to-use AI Prompt in English)**: जिसे यूज़र Mera AI के इमेज जनरेटर में डालकर थंबनेल का बेस बैकग्राउंड बना सके।`;
      break;

    case 'shorts':
      userPrompt = `यूट्यूब शॉर्ट्स और इंस्टाग्राम रील्स (Vertical 9:16, 50-60 सेकंड) के लिए एक सुपर वायरल और तेज़-तर्रार स्क्रिप्ट लिखें।
${videoContext}
विषय: ${topic || videoData?.title || 'वायरल शॉर्ट्स'}
${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}

प्रारूप:
- ⏱️ **0 से 3 सेकंड (Pattern Interrupt Hook)**: स्क्रॉल रोकने वाला पहला शब्द और विज़ुअल।
- ⏱️ **3 से 40 सेकंड (3 Rapid-Fire Value Points)**: 3 तेज़ टिप्स, हर 5 सेकंड पर ऑन-स्क्रीन टेक्स्ट।
- ⏱️ **40 से 55 सेकंड (Climax / Best Secret)**: सबसे अहम बात।
- ⏱️ **55 से 60 सेकंड (Seamless Loop / Subscribe Call)**: लूपिंग एंडिंग।`;
      break;

    default:
      userPrompt = `YouTube वीडियो "${videoData?.title || topic}" के बारे में उपयोगी जानकारी, विश्लेषण और सुझाव प्रदान करें।`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const resultText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'यूट्यूब विश्लेषण तैयार नहीं हो सका। कृपया पुनः प्रयास करें।';

    res.json({
      success: true,
      action,
      content: resultText,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[YouTube AI Studio Error]:', error.message);
    res.status(500).json({
      error: error.message || 'यूट्यूब AI टूल चलाने में समस्या आई।',
    });
  }
});

// Web Browsing System Helper: HTML text and metadata extractor
function extractCleanWebpageText(html: string): { title: string; description: string; text: string } {
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/\s+/g, ' ').trim();
  } else {
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (ogTitle) title = ogTitle[1].trim();
  }

  let description = '';
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (descMatch) {
    description = descMatch[1].replace(/\s+/g, ' ').trim();
  }

  let body = html;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  body = body.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  body = body.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  body = body.replace(/<header[\s\S]*?<\/header>/gi, ' ');
  body = body.replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  body = body.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n');
  body = body.replace(/<br\s*[\/]?>/gi, '\n');
  body = body.replace(/<[^>]+>/g, ' ');

  body = body
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  const cleanLines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  const text = cleanLines.slice(0, 80).join('\n\n').slice(0, 10000);

  return {
    title: title || 'वेबपेज',
    description: description || '',
    text: text || 'वेबपेज की सामग्री पढ़ी गई।',
  };
}

// Web Browsing System: Live URL Fetcher
app.post('/api/browse/fetch-page', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL आवश्यक है।' });
    return;
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const parsed = new URL(targetUrl);
    const domain = parsed.hostname.replace(/^www\./, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    const pageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MeraAI-Browser/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'hi,en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!pageRes.ok) {
      throw new Error(`वेबसाइट ने HTTP ${pageRes.status} त्रुटि लौटाई।`);
    }

    const html = await pageRes.text();
    const extracted = extractCleanWebpageText(html);

    res.json({
      success: true,
      url: targetUrl,
      domain,
      favicon,
      title: extracted.title,
      description: extracted.description,
      content: extracted.text,
      snippet: extracted.text.slice(0, 350),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('[Web Browsing fetch-page Error]:', error.message);
    res.status(500).json({
      error: `वेबसाइट लोड करने में त्रुटि: ${error.message || 'कनेक्शन विफल'}`,
    });
  }
});

// Web Browsing System: AI Webpage Analysis & Reader
app.post('/api/browse/analyze', async (req: Request, res: Response) => {
  const {
    url,
    title = '',
    content = '',
    action = 'summarize',
    query = '',
    language = 'hindi',
  } = req.body;

  if (!url && !content) {
    res.status(400).json({ error: 'URL या सामग्री आवश्यक है।' });
    return;
  }

  const langInstruction =
    language === 'hindi'
      ? 'मुख्य भाषा: हिंदी (देवनागरी लिपि)। सहज, तथ्यात्मक और स्पष्ट हिंदी का प्रयोग करें।'
      : language === 'hinglish'
      ? 'मुख्य भाषा: Hinglish (Hindi written in Roman English alphabet)।'
      : language === 'english'
      ? 'Primary language: English with clear headings and executive structure.'
      : 'User preference: Use natural Hindi or English matching user query.';

  const systemPrompt = `You are "Mera AI - Web Browsing & Research Engine" (वेब ब्राउज़िंग व अनुसंधान प्रणाली).
You are an intelligent web crawler, reader, and factual analyst.
${langInstruction}
- Always provide verified, objective, and unbiased analysis based directly on the provided webpage content.
- Format with clear Markdown headings, bullet points, and key takeaways.
- Do NOT provide unsolicited piracy or moral lectures. Answer factually.`;

  let prompt = '';
  const contextSnippet = content ? `\n\nवेबपेज सामग्री (Webpage Content):\n${content.slice(0, 8000)}` : '';

  switch (action) {
    case 'summarize':
      prompt = `निम्नलिखित वेबपेज का संपूर्ण और स्पष्ट विश्लेषण (Comprehensive Webpage Summary) तैयार करें:
- URL: ${url}
- शीर्षक: ${title}${contextSnippet}
${query ? `\nउपयोगकर्ता का विशेष सवाल: ${query}` : ''}

कृपया इस प्रारूप में उत्तर दें:
1. 📌 **एक नज़र में (Executive TL;DR)**: 2-3 वाक्यों में पेज का मूल उद्देश्य और मुख्य सार।
2. 🔑 **प्रमुख बिंदु व मुख्य बातें (Key Highlights & Facts)**: 5-7 बुलेट पॉइंट्स में सबसे महत्वपूर्ण जानकारी।
3. 📊 **महत्वपूर्ण आंकड़े, तिथियां व विवरण (Figures, Dates & Data)**: यदि उपलब्ध हों।
4. 💡 **निष्कर्ष व अगला कदम (Key Takeaways)**: इस पेज से मिलने वाली मुख्य सीख।`;
      break;

    case 'key_facts':
      prompt = `इस वेबपेज से केवल सबसे महत्वपूर्ण और प्रामाणिक तथ्य, आंकड़े और मुख्य बिंदु निकालें:
- URL: ${url}
- शीर्षक: ${title}${contextSnippet}

कृपया बुलेट पॉइंट्स में स्पष्ट 'Fact Sheet' तैयार करें।`;
      break;

    case 'qa':
      prompt = `इस वेबपेज की सामग्री के आधार पर उपयोगकर्ता के प्रश्न का सटीक, बिंदुवार उत्तर दें:
- URL: ${url}
- शीर्षक: ${title}
- प्रश्न: "${query || 'इस पेज की मुख्य जानकारी क्या है?'}"${contextSnippet}`;
      break;

    default:
      prompt = `निम्नलिखित वेबपेज का विश्लेषण करें:\n- URL: ${url}\n- शीर्षक: ${title}${contextSnippet}`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });

    const resultText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'वेबपेज का विश्लेषण तैयार नहीं हो सका।';

    res.json({
      success: true,
      action,
      content: resultText,
      url,
      title,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Web Browsing analyze Error]:', error.message);
    res.status(500).json({
      error: error.message || 'वेबपेज का विश्लेषण करने में समस्या आई।',
    });
  }
});

// Download complete Android Kotlin Project as zip
app.get('/api/download/android-project.zip', (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'MeraAI-Android-Motorola-G96.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'MeraAI-Android-Motorola-G96.zip');
  } else {
    res.status(404).json({ error: 'Android ZIP not found' });
  }
});

// Setup Vite dev server or production static distribution
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mera AI server running on port ${PORT} [Web Browsing Enabled]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
