export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: Array<Omit<ChatMessage, "system">>;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface FormMatch {
  formCode: string;
  name: string;
  filingFrequency: string;
  deadlineDay: number;
  deadlineMonthOffset: number;
  category: string;
}
