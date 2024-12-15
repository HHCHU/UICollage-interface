export interface ImageData {
  file: File;
  preview: string;
  id: string;
  blob?: Blob;
}

export interface ServerConfig {
  ip: string;
  port: string;
}

export interface Rating {
  score: number;
  comment?: string;
  timestamp: number;
}

export interface ReferenceSet {
  id: string;
  modelType: "baseline" | "our";
  inputImages: {
    id: string;
    url: string;
  }[];
  referenceImages: {
    id: string;
    url: string;
    setIndex: number;
    imageIndex: number;
  }[];
  rating?: Rating;
  agentDiscussion?: {
    messages: {
      role: "user" | "agent";
      content: string;
      timestamp: number;
    }[];
  };
  timestamp: number;
  userId?: string;
}

export interface ReferenceSetInfo {
  id: string;
  timestamp: number;
}

export interface UserHistory {
  userId: string;
  referenceSets: ReferenceSetInfo[];
  lastAccessed: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrls?: string[];
  isNewImageSet?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  currentImageSetId?: string;
}
