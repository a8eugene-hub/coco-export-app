export type ChatMessageType = "text" | "file" | "image" | "system" | "unknown";

export type ExtractedMessage = {
  sender: string | null;
  time: string | null;
  type: ChatMessageType;
  text_original: string | null;
  file_name: string | null;
  file_hint: string | null;
  order_hint: number;
  source_image_id: string;
};

export type ConversationMessage = {
  id: string;
  sender: string | null;
  time_text: string | null;
  type: ChatMessageType | string;
  text_original: string | null;
  text_ja: string | null;
  file_name: string | null;
  file_hint: string | null;
  sort_order: number;
  created_at: string;
};

