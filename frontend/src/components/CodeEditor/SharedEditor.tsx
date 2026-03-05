import Editor from "@monaco-editor/react";

export function SharedEditor() {
  // TODO: Initialize Yjs doc, y-monaco binding, WebSocket provider for CRDT sync
  // TODO: Wire up code context tracking (cursor position, visible range, file path)

  return (
    <div className="flex h-full flex-col">
      {/* File tabs */}
      <div className="flex h-9 items-center gap-1 border-b border-gray-800 px-2">
        <div className="rounded bg-gray-800 px-3 py-1 text-xs text-gray-300">
          main.py
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          defaultValue={`# CodeBridge — Shared Editor\n# Both developers see the same code in real time.\n\ndef authenticate_user(username: str, password: str) -> bool:\n    \"\"\"Authenticate a user with the given credentials.\"\"\"\n    # TODO: Implement authentication logic\n    return False\n`}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
