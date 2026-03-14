import { useCallback, useState } from "react";
import { useVoicePipeline } from "../../hooks/useVoicePipeline";
import { useCommunicationStore } from "../../stores/communicationStore";

export function CommunicationPanel({
  sendDeafSpeech,
  sendClientCaption,
  isConnected,
}: {
  sendDeafSpeech: (text: string) => void;
  sendClientCaption?: (text: string, speaker?: string) => void;
  isConnected: boolean;
}) {
  const [deafInput, setDeafInput] = useState("");
  const captions = useCommunicationStore((s) => s.captions);
  const addCaption = useCommunicationStore((s) => s.addCaption);
  const captionAudioEnabled = useCommunicationStore((s) => s.captionAudioEnabled);
  const setCaptionAudioEnabled = useCommunicationStore((s) => s.setCaptionAudioEnabled);

  const onCaption = useCallback(
    (text: string, speaker: string = "hearing_dev") => {
      addCaption(text, speaker);
    },
    [addCaption]
  );

  const { start, stop, isListening, error } = useVoicePipeline(onCaption, sendClientCaption);

  return (
    <div className="flex h-full flex-col">
      {/* Header + Mic control */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-gray-800 px-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Live Communication
        </h2>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <span className="text-[10px] text-amber-500">Connecting…</span>
          )}
          <button
            onClick={isListening ? stop : start}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isListening
                ? "bg-red-900/50 text-red-400 hover:bg-red-900/70"
                : "bg-green-900/50 text-green-400 hover:bg-green-900/70"
            }`}
          >
            {isListening ? "Stop mic" : "Start mic"}
          </button>
          <button
            onClick={async () => {
              try {
                const base = typeof window !== "undefined" ? window.location.origin : "";
                const r = await fetch(`${base}/debug/caption/demo?text=Test+caption`);
                if (!r.ok) throw new Error(await r.text());
              } catch (e) {
                console.error("Test caption failed:", e);
              }
            }}
            className="rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-800/50 hover:text-gray-400"
            title="Simulate a caption (no mic needed)"
          >
            Quick test
          </button>
          <button
            onClick={() => setCaptionAudioEnabled(!captionAudioEnabled)}
            className={`rounded px-2 py-1 text-[10px] transition-colors ${
              captionAudioEnabled
                ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/70"
                : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-400"
            }`}
            title={captionAudioEnabled ? "Caption audio on (click to mute)" : "Caption audio off (click to enable)"}
          >
            {captionAudioEnabled ? "🔊 Audio on" : "🔇 Audio off"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded bg-red-900/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {captions.length === 0 && !isListening && (
            <p className="text-sm text-gray-500">
              {isConnected
                ? "Click &quot;Start mic&quot; to speak, or type below to speak as deaf dev."
                : "Connecting..."}
            </p>
          )}
          {captions.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-gray-900 p-3 ring-1 ring-gray-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    c.speaker === "deaf_dev" ? "text-amber-400" : "text-blue-400"
                  }`}
                >
                  {c.speaker === "deaf_dev" ? "Deaf Dev" : "Hearing Dev"}
                </span>
                <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-400">
                  Live
                </span>
              </div>
              <p className="text-sm leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deaf dev: type → TTS for hearing dev */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={deafInput}
            onChange={(e) => setDeafInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && deafInput.trim()) {
                const text = deafInput.trim();
                sendDeafSpeech(text);
                setDeafInput("");
              }
            }}
            placeholder="Deaf dev: type & press Enter to speak..."
            className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-300 ring-1 ring-gray-700 placeholder:text-gray-600 focus:outline-none focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (deafInput.trim()) {
                const text = deafInput.trim();
                sendDeafSpeech(text);
                setDeafInput("");
              }
            }}
            disabled={!deafInput.trim() || !isConnected}
            className="rounded-lg bg-amber-900/50 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-900/70 disabled:opacity-50"
          >
            Speak
          </button>
        </div>
      </div>
    </div>
  );
}
