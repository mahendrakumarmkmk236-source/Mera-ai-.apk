export type PersonaKey =
  | 'general'
  | 'youtube_song'
  | 'document_pdf'
  | 'literature'
  | 'coding'
  | 'student'
  | 'hinglish';

export type LanguagePreference = 'auto' | 'hindi' | 'hinglish' | 'english';

export interface PersonaInfo {
  id: PersonaKey;
  name: string;
  hindiName: string;
  tagline: string;
  icon: string;
  badge: string;
  placeholder: string;
}

export interface AttachedFile {
  mimeType: string;
  data: string; // base64
  previewUrl: string;
  name: string;
  size: number;
  isPdf: boolean;
}

export interface WebSource {
  title: string;
  uri: string;
  domain?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachment?: AttachedFile;
  sources?: WebSource[];
  searchQueries?: string[];
  isStreaming?: boolean;
  error?: boolean;
  errorType?: 'SEARCH_QUOTA_EXHAUSTED' | 'AUTH_ERROR' | 'SEARCH_TOOL_ERROR' | 'GENERAL_ERROR';
  canRetry?: boolean;
  canAskWithoutSearch?: boolean;
  lastQuery?: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
  messages: ChatMessage[];
  persona: PersonaKey;
}

export interface PromptSuggestion {
  id: string;
  category: string;
  title: string;
  prompt: string;
  icon: string;
  personaTarget?: PersonaKey;
}

export type YouTubeToolAction =
  | 'summarize'
  | 'titles'
  | 'script'
  | 'seo'
  | 'thumbnail'
  | 'shorts';

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  author: string;
  authorUrl?: string;
  thumbnailUrl: string;
  embedUrl: string;
  url: string;
}

