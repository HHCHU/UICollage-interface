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
