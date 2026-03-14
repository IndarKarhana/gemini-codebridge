import { useYjsStore } from "../../stores/yjsStore";

export function SessionControls() {
  const yjsStatus = useYjsStore((s) => s.status);

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded px-2 py-1 text-xs font-medium ${
          yjsStatus === "connected"
            ? "bg-emerald-500/25 text-emerald-400"
            : yjsStatus === "connecting"
              ? "bg-amber-500/25 text-amber-400"
              : "bg-red-500/25 text-red-400"
        }`}
        title={
          yjsStatus === "connected"
            ? "Code sync — edits appear in all tabs"
            : yjsStatus === "connecting"
              ? "Connecting to sync server…"
              : "Code sync offline"
        }
      >
        {yjsStatus === "connected" ? "● Synced" : yjsStatus === "connecting" ? "○ Connecting…" : "○ Offline"}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Connected
      </span>
      <span className="rounded bg-gray-800/80 px-2 py-0.5 text-[10px] text-gray-400">
        Demo
      </span>
    </div>
  );
}
