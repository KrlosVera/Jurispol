
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: GroundingSource[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
