import { useCallback } from "react";
import { VideoPanel } from "./components/VideoPanel/VideoPanel";
import { SharedEditor } from "./components/CodeEditor/SharedEditor";
import { CommunicationPanel } from "./components/CommunicationPanel/CommunicationPanel";
import { SessionControls } from "./components/SessionControls/SessionControls";
import { useAgentConnection } from "./hooks/useAgentConnection";
import { useCommunicationStore } from "./stores/communicationStore";

function playSpeechAudio(audioBase64: string, sampleRate: number) {
  try {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ctx = new AudioContext({ sampleRate });
    const buffer = ctx.createBuffer(1, bytes.length / 2, sampleRate);
    const channel = buffer.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < channel.length; i++) {
      channel[i] = view.getInt16(i * 2, true) / 32768;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    console.error("Play speech failed:", e);
  }
}

export function App() {
  const addCaption = useCommunicationStore((s) => s.addCaption);
  const addMessage = useCommunicationStore((s) => s.addMessage);

  const onCaption = useCallback(
    (text: string, speaker: string = "hearing_dev") => {
      addCaption(text, speaker);
      addMessage({
        id: crypto.randomUUID(),
        type: "caption",
        speaker,
        text,
        confidence: 1,
        timestamp: new Date().toISOString(),
      });
    },
    [addCaption, addMessage]
  );

  const captionAudioEnabled = useCommunicationStore((s) => s.captionAudioEnabled);
  const onSpeech = useCallback(
    (audioBase64: string, sampleRate: number) => {
      if (captionAudioEnabled) playSpeechAudio(audioBase64, sampleRate);
    },
    [captionAudioEnabled]
  );

  const { sendDeafSpeech, sendSignFrame, sendClientCaption, isConnected } = useAgentConnection(
    onCaption,
    onSpeech
  );

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-blue-400">Code</span>Bridge
        </h1>
        <SessionControls />
      </header>

      {/* Main Layout — 3 panels */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Video feeds */}
        <aside className="flex w-72 flex-col border-r border-gray-800">
          <VideoPanel sendSignFrame={sendSignFrame} isConnected={isConnected} />
        </aside>

        {/* Center: Code editor */}
        <section className="flex-1">
          <SharedEditor />
        </section>

        {/* Right: Communication panel */}
        <aside className="flex w-96 flex-col border-l border-gray-800">
          <CommunicationPanel
            sendDeafSpeech={sendDeafSpeech}
            sendClientCaption={sendClientCaption}
            isConnected={isConnected}
          />
        </aside>
      </main>
    </div>
  );
}
