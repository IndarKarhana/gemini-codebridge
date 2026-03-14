export function SessionControls() {
  return (
    <div className="flex items-center gap-3">
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
