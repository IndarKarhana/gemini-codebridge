export function VideoPanel() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Participants
      </h2>

      {/* Hearing developer's video */}
      <div className="relative aspect-video rounded-lg bg-gray-900 ring-1 ring-gray-800">
        <div className="absolute bottom-2 left-2 rounded bg-gray-900/80 px-2 py-0.5 text-xs">
          Hearing Dev
        </div>
        {/* TODO: LiveKit VideoTrack component */}
      </div>

      {/* Deaf developer's video + MediaPipe overlay */}
      <div className="relative aspect-video rounded-lg bg-gray-900 ring-1 ring-gray-800">
        <div className="absolute bottom-2 left-2 rounded bg-gray-900/80 px-2 py-0.5 text-xs">
          Deaf Dev
        </div>
        {/* TODO: LiveKit VideoTrack + MediaPipe hand landmark overlay */}
      </div>

      {/* Sound visualizer for deaf developer */}
      <div className="mt-auto rounded-lg bg-gray-900 p-3 ring-1 ring-gray-800">
        <p className="mb-1 text-xs text-gray-500">Sound Activity</p>
        <div className="flex h-8 items-end gap-0.5">
          {/* TODO: Audio level bars driven by LiveKit audio track */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-blue-500/30"
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
