export function CommunicationPanel() {
  // TODO: Subscribe to agent WebSocket for captions, highlights, disambiguation

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-9 items-center border-b border-gray-800 px-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Live Communication
        </h2>
      </div>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {/* Example caption — will be driven by agent messages */}
          <div className="rounded-lg bg-gray-900 p-3 ring-1 ring-gray-800">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400">
                Hearing Dev
              </span>
              <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-400">
                95% confidence
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Let&apos;s refactor{" "}
              <code className="rounded bg-blue-900/30 px-1 text-blue-300">
                authenticate_user
              </code>{" "}
              at line 4 to use async/await.
            </p>
          </div>

          <div className="rounded-lg bg-gray-900 p-3 ring-1 ring-purple-900/50">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-purple-400">
                Deaf Dev (signed)
              </span>
              <span className="rounded bg-yellow-900/50 px-1.5 py-0.5 text-[10px] text-yellow-400">
                78% confidence
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              I think we should also rename the{" "}
              <code className="rounded bg-purple-900/30 px-1 text-purple-300">
                password
              </code>{" "}
              parameter to{" "}
              <code className="rounded bg-purple-900/30 px-1 text-purple-300">
                credentials
              </code>
              .
            </p>
          </div>
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
