export interface APIResponse {
  message: string;
  images?: string[];
}

export interface ImageUploadRequest {
  images: string[];
}

export interface ServerConfig {
  host: string;
}

// Gemini API를 위한 새로운 인터페이스들
export interface GeminiMessage {
  role: "user" | "model";
  parts: {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}
