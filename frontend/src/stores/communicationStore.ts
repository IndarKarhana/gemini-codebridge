import { create } from "zustand";

interface AgentMessage {
  id: string;
  type: "caption" | "code_highlight" | "disambiguation";
  speaker: string;
  text: string;
  confidence: number;
  timestamp: string;
  codeReferences?: Array<{
    entityType: string;
    name: string;
    file: string;
    lineRange: [number, number];
  }>;
}

interface CommunicationState {
  messages: AgentMessage[];
  addMessage: (msg: AgentMessage) => void;
  clearMessages: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}));
