import { useCallback, useState } from "react";
import { useVoicePipeline } from "../../hooks/useVoicePipeline";
import { useCommunicationStore } from "../../stores/communicationStore";

export function CommunicationPanel() {
  const [captions, setCaptions] = useState<Array<{ id: string; text: string; speaker: string }>>([]);
  const addMessage = useCommunicationStore((s) => s.addMessage);

  const onCaption = useCallback((text: string) => {
    setCaptions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, speaker: "hearing_dev" },
    ]);
    addMessage({
      id: crypto.randomUUID(),
      type: "caption",
      speaker: "hearing_dev",
      text,
      confidence: 1,
      timestamp: new Date().toISOString(),
    });
  }, [addMessage]);

  const { start, stop, isListening, error } = useVoicePipeline(onCaption);

  return (
    <div className="flex h-full flex-col">
      {/* Header + Mic control */}
      <div className="flex h-9 items-center justify-between border-b border-gray-800 px-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Live Communication
        </h2>
        <button
          onClick={isListening ? stop : start}
          className={`rounded px-2 py-1 text-xs font-medium ${
            isListening
              ? "bg-red-900/50 text-red-400 hover:bg-red-900/70"
              : "bg-green-900/50 text-green-400 hover:bg-green-900/70"
          }`}
        >
          {isListening ? "Stop mic" : "Start mic"}
        </button>
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
              Click &quot;Start mic&quot; to begin. Speak and see live captions here.
            </p>
          )}
          {captions.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-gray-900 p-3 ring-1 ring-gray-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-blue-400">
                  Hearing Dev
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

      {/* Text input fallback for deaf developer */}
      <div className="border-t border-gray-800 p-3">
        <input
          type="text"
          placeholder="Type a message (fallback)..."
          className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-300 ring-1 ring-gray-700 placeholder:text-gray-600 focus:outline-none focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
