import { create } from "zustand";

interface SessionState {
  sessionId: string | null;
  status: "idle" | "connecting" | "active" | "ended";
  role: "hearing" | "deaf" | null;
  setSession: (id: string, role: "hearing" | "deaf") => void;
  setStatus: (status: SessionState["status"]) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  status: "idle",
  role: null,
  setSession: (id, role) => set({ sessionId: id, role, status: "active" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ sessionId: null, status: "idle", role: null }),
}));
