import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_RATE = 16000;
const SESSION_ID = "demo";

function downsampleBuffer(
  buffer: Float32Array,
  sampleRate: number,
  outSampleRate: number
): Float32Array {
  if (outSampleRate === sampleRate) return buffer;
  const ratio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i] ?? 0;
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function float32ToInt16(buffer: Float32Array): ArrayBuffer {
  const buf = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i] ?? 0));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf.buffer;
}

export function useVoicePipeline(onCaption: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaWsRef = useRef<WebSocket | null>(null);
  const agentWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const mediaWsUrl = `${protocol}//${host}/ws/media/${SESSION_ID}`;
  const agentWsUrl = `${protocol}//${host}/ws/agent/${SESSION_ID}`;

  const stop = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    mediaWsRef.current?.close();
    mediaWsRef.current = null;
    agentWsRef.current?.close();
    agentWsRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      await ctx.audioWorklet.addModule("/pcm-processor.js");
      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "pcm-processor");
      sourceRef.current = source;
      workletNodeRef.current = worklet;

      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;
      source.connect(worklet);
      worklet.connect(muteGain);
      muteGain.connect(ctx.destination);

      const mediaWs = new WebSocket(mediaWsUrl);
      mediaWs.binaryType = "arraybuffer";
      mediaWsRef.current = mediaWs;

      const agentWs = new WebSocket(agentWsUrl);
      agentWsRef.current = agentWs;
      agentWs.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "caption" && msg.text) {
            onCaption(msg.text);
          }
        } catch {
          // ignore
        }
      };

      await new Promise<void>((resolve, reject) => {
        const done = () => {
          mediaWs.removeEventListener("open", onOpen);
          mediaWs.removeEventListener("error", onErr);
        };
        const onOpen = () => {
          done();
          resolve();
        };
        const onErr = () => {
          done();
          reject(new Error("WebSocket connection failed"));
        };
        mediaWs.addEventListener("open", onOpen);
        mediaWs.addEventListener("error", onErr);
        if (mediaWs.readyState === WebSocket.OPEN) onOpen();
      });

      worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (mediaWs.readyState !== WebSocket.OPEN) return;
        const float32 = e.data;
        const downsampled = downsampleBuffer(float32, ctx.sampleRate, SAMPLE_RATE);
        const pcm16 = float32ToInt16(downsampled);
        mediaWs.send(pcm16);
      };

      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      stop();
    }
  }, [mediaWsUrl, agentWsUrl, onCaption, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, isListening, error };
}
