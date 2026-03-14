import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaStore } from "../stores/mediaStore";

const SAMPLE_RATE = 16000;
const SESSION_ID = "demo";
// Buffer ~320ms of audio before sending (Gemini works better with larger chunks)
const BUFFER_MS = 320;
const BUFFER_SAMPLES = Math.round((SAMPLE_RATE * BUFFER_MS) / 1000);

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

type SpeechRecAPI = new () => {
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
};

const SpeechRecognition =
  typeof window !== "undefined"
    ? ((window as unknown as { SpeechRecognition?: SpeechRecAPI }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecAPI }).webkitSpeechRecognition)
    : null;

export function useVoicePipeline(
  onCaption: (text: string) => void,
  sendClientCaption?: (text: string, speaker?: string) => void
) {
  const setAudioLevels = useMediaStore((s) => s.setAudioLevels);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const speechRecRef = useRef<{ stop: () => void } | null>(null);

  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const mediaWsUrl = `${protocol}//${host}/ws/media/${SESSION_ID}`;

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAudioLevels(Array(12).fill(0));
    analyserRef.current = null;
    speechRecRef.current?.stop();
    speechRecRef.current = null;
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

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;
      source.connect(analyser);
      analyser.connect(worklet);
      worklet.connect(muteGain);
      muteGain.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 12;

      const updateLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels: number[] = [];
        const step = Math.floor(dataArray.length / barCount);
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += dataArray[i * step + j] ?? 0;
          levels.push(Math.min(1, (sum / step / 255) * 2));
        }
        setAudioLevels(levels);
        rafRef.current = requestAnimationFrame(updateLevels);
      };
      rafRef.current = requestAnimationFrame(updateLevels);

      const mediaWs = new WebSocket(mediaWsUrl);
      mediaWs.binaryType = "arraybuffer";
      mediaWsRef.current = mediaWs;

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

      const buffer: number[] = [];
      worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (mediaWs.readyState !== WebSocket.OPEN) return;
        const float32 = e.data;
        const downsampled = downsampleBuffer(float32, ctx.sampleRate, SAMPLE_RATE);
        for (let i = 0; i < downsampled.length; i++) buffer.push(downsampled[i] ?? 0);
        while (buffer.length >= BUFFER_SAMPLES) {
          const chunk = buffer.splice(0, BUFFER_SAMPLES);
          const pcm16 = float32ToInt16(new Float32Array(chunk));
          mediaWs.send(pcm16);
        }
      };

      // Web Speech API fallback — route through backend so all tabs receive voice captions
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (e: { results: SpeechRecognitionResultList }) => {
          const last = e.results[e.results.length - 1];
          if (!last) return;
          const t = last[0]?.transcript?.trim();
          if (t && last.isFinal) {
            if (sendClientCaption) {
              sendClientCaption(t, "hearing_dev");
            } else {
              onCaption(t);
            }
          }
        };
        rec.start();
        speechRecRef.current = rec;
      }

      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      stop();
    }
  }, [mediaWsUrl, onCaption, sendClientCaption, setAudioLevels, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, isListening, error };
}
