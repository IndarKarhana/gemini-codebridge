import { create } from "zustand";

export type YjsStatus = "connecting" | "connected" | "disconnected";

interface YjsStore {
  status: YjsStatus;
  setStatus: (status: YjsStatus) => void;
}

export const useYjsStore = create<YjsStore>((set) => ({
  status: "connecting",
  setStatus: (status) => set({ status }),
}));
