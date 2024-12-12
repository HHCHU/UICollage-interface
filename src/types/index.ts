export interface ImageData {
  file: File;
  preview: string;
  id: string;
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
  inputImages: {
    id: string;
    url: string;
  }[];
  referenceImages: {
    id: string;
    url: string;
    setIndex: number; // 1, 2, 3 중 어떤 세트에 속하는지
    imageIndex: number; // 세트 내에서 몇 번째 이미지인지
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
}

export interface UserHistory {
  userId: string;
  referenceSets: ReferenceSet[];
  lastAccessed: number;
}
