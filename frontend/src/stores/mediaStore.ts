import { create } from "zustand";

interface MediaState {
  audioLevels: number[];
  setAudioLevels: (levels: number[]) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  audioLevels: Array(12).fill(0),
  setAudioLevels: (levels) => set({ audioLevels: levels }),
}));
