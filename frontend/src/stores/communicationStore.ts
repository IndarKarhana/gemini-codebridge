import { create } from "zustand";

interface CaptionItem {
  id: string;
  text: string;
  speaker: string;
}

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
  captions: CaptionItem[];
  captionAudioEnabled: boolean;
  addMessage: (msg: AgentMessage) => void;
  addCaption: (text: string, speaker: string) => void;
  setCaptionAudioEnabled: (enabled: boolean) => void;
  clearMessages: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  messages: [],
  captions: [],
  captionAudioEnabled: false,
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  addCaption: (text, speaker = "hearing_dev") =>
    set((state) => ({
      captions: [
        ...state.captions,
        { id: crypto.randomUUID(), text, speaker },
      ],
    })),
  setCaptionAudioEnabled: (enabled) => set({ captionAudioEnabled: enabled }),
  clearMessages: () => set({ messages: [], captions: [] }),
}));
