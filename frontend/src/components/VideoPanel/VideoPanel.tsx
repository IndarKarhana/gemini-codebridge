import { useRef, useState } from "react";
import { useMediaStore } from "../../stores/mediaStore";
import { useSignLanguage } from "../../hooks/useSignLanguage";

export function VideoPanel({
  sendSignFrame,
  isConnected,
}: {
  sendSignFrame: (imageBase64: string) => void;
  isConnected: boolean;
}) {
  const audioLevels = useMediaStore((s) => s.audioLevels);
  const [signEnabled, setSignEnabled] = useState(false);
  const deafVideoRef = useRef<HTMLVideoElement>(null);
  const deafCanvasRef = useRef<HTMLCanvasElement>(null);

  const { error: signError, stop: stopSign, isSigning } = useSignLanguage(
    deafVideoRef,
    deafCanvasRef,
    sendSignFrame,
    signEnabled && isConnected
  );

  const toggleSign = () => {
    if (signEnabled) {
      stopSign();
      setSignEnabled(false);
    } else {
      setSignEnabled(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Participants
      </h2>

      {/* Hearing developer — placeholder (or self-view when mic on) */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900/50 ring-1 ring-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-gray-600">Hearing Dev</p>
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-gray-900/90 px-2 py-0.5 text-[10px] text-gray-400">
          Video
        </div>
      </div>

      {/* Deaf developer — camera for sign language */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900/50 ring-1 ring-gray-800">
        {signEnabled ? (
          <>
            <video
              ref={deafVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <canvas ref={deafCanvasRef} className="hidden" />
            <div className="absolute bottom-2 left-2 rounded bg-amber-900/90 px-2 py-0.5 text-[10px] text-amber-300">
              {isSigning ? "Signing…" : "Sign mode — show hands"}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-gray-600">Deaf Dev</p>
            <button
              onClick={toggleSign}
              disabled={!isConnected}
              className="rounded bg-amber-900/50 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-900/70 disabled:opacity-50"
            >
              Start sign
            </button>
          </div>
        )}
        {signEnabled && (
          <button
            onClick={toggleSign}
            className="absolute top-2 right-2 rounded bg-red-900/80 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-900"
          >
            Stop
          </button>
        )}
      </div>

      {signError && (
        <p className="text-xs text-red-400">{signError}</p>
      )}

      {/* Sound activity — real-time from mic */}
      <div className="mt-auto rounded-lg bg-gray-900/50 p-3 ring-1 ring-gray-800">
        <p className="mb-2 text-xs text-gray-500">Sound Activity</p>
        <div className="flex h-6 items-end gap-0.5">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-blue-500/50 transition-all duration-75"
              style={{
                height: `${Math.max(4, level * 24)}px`,
              }}
            />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-600">Shows when mic is active</p>
      </div>
    </div>
  );
}
