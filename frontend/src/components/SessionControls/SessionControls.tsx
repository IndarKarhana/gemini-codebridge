export function SessionControls() {
  // TODO: Wire up session create/join/end via REST API
  // TODO: LiveKit room connection state

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Session Active
      </span>
      <button className="rounded bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700">
        End Session
      </button>
    </div>
  );
}
