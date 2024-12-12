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
