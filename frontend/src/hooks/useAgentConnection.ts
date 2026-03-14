import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_ID = "demo";

export function useAgentConnection(
  onCaption: (text: string, speaker?: string) => void,
  onSpeech: (audioBase64: string, sampleRate: number) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const agentWsRef = useRef<WebSocket | null>(null);
  const onCaptionRef = useRef(onCaption);
  const onSpeechRef = useRef(onSpeech);
  onCaptionRef.current = onCaption;
  onSpeechRef.current = onSpeech;

  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const agentWsUrl = `${protocol}//${host}/ws/agent/${SESSION_ID}`;

  const sendDeafSpeech = useCallback((text: string) => {
    const ws = agentWsRef.current;
    if (ws?.readyState === WebSocket.OPEN && text.trim()) {
      ws.send(JSON.stringify({ type: "deaf_speech", text: text.trim() }));
    }
  }, []);

  /** Send a client-side caption (e.g. from Web Speech API) so backend can broadcast to all tabs. */
  const sendClientCaption = useCallback((text: string, speaker: string = "hearing_dev") => {
    const ws = agentWsRef.current;
    if (ws?.readyState === WebSocket.OPEN && text.trim()) {
      ws.send(JSON.stringify({ type: "client_caption", text: text.trim(), speaker }));
    }
  }, []);

  const sendSignFrame = useCallback((imageBase64: string) => {
    const ws = agentWsRef.current;
    if (ws?.readyState === WebSocket.OPEN && imageBase64) {
      if (import.meta.env.DEV) {
        console.debug("[CodeBridge] Sending sign frame", imageBase64.length, "chars");
      }
      ws.send(JSON.stringify({ type: "sign_frame", image: imageBase64 }));
    } else if (import.meta.env.DEV && !ws?.readyState) {
      console.warn("[CodeBridge] Cannot send sign frame: WebSocket not open");
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(agentWsUrl);
    agentWsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "caption" && msg.text) {
          if (import.meta.env.DEV) {
            console.debug("[CodeBridge] Caption received:", msg.speaker, msg.text?.slice(0, 50));
          }
          onCaptionRef.current(msg.text, msg.speaker || "hearing_dev");
        } else if (msg.type === "speech" && msg.audio) {
          onSpeechRef.current(msg.audio, msg.sample_rate || 24000);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      agentWsRef.current = null;
      setIsConnected(false);
    };
  }, [agentWsUrl]);

  return { sendDeafSpeech, sendSignFrame, sendClientCaption, isConnected, agentWsRef };
}
