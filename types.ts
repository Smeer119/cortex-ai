
export type MemoryType = 'note' | 'task' | 'checklist' | 'reminder';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  type: 'image' | 'audio';
  url: string; // base64 or blob url
  name?: string;
}

export interface MemoryStyle {
  backgroundColor?: string;
  highlightColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  titleAlign?: 'left' | 'center' | 'right' | 'justify';
  contentAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title?: string;
  content: string;
  items?: ChecklistItem[];
  tags: string[];
  timestamp: number;
  reminderAt?: number;
  isPinned?: boolean;
  style?: MemoryStyle;
  attachments?: Attachment[];
}

export interface VoiceState {
  isListening: boolean;
  isThinking: boolean;
  transcript: string;
  lastResponse: string;
}
