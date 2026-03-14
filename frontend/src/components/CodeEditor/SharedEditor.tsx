import { useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import { useYjsStore } from "../../stores/yjsStore";

const ROOM = "codebridge";
const DEFAULT_CODE = `# CodeBridge — Shared Editor
# Both developers see the same code in real time.

def authenticate_user(username: str, password: str) -> bool:
    """Authenticate a user with the given credentials."""
    # TODO: Implement authentication logic
    return False
`;

function getYjsWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost:1234";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/yjs`;
}

export function SharedEditor() {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const setYjsStatus = useYjsStore((s) => s.setStatus);

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      const ydoc = ydocRef.current;
      const provider = providerRef.current;
      if (!ydoc || !provider) return;

      const ytext = ydoc.getText("monaco");
      const model = editor.getModel();
      if (!model) return;

      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;
    },
    []
  );

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = getYjsWsUrl();
    const provider = new WebsocketProvider(wsUrl, ROOM, ydoc);
    providerRef.current = provider;

    const onStatus = (event: { status: "connecting" | "connected" | "disconnected" }) =>
      setYjsStatus(event.status);
    provider.on("status", onStatus);
    if (provider.wsconnected) setYjsStatus("connected");

    // Initialize with default content if empty
    const ytext = ydoc.getText("monaco");
    if (ytext.length === 0) {
      ytext.insert(0, DEFAULT_CODE);
    }

    return () => {
      provider.off("status", onStatus);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      provider.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-gray-800 px-3">
        <span className="shrink-0 text-xs font-medium text-gray-400">Shared Editor</span>
        <div className="shrink-0 rounded bg-gray-800/80 px-2 py-0.5 text-[10px] text-gray-500">
          main.py
        </div>
        <span className="hidden shrink-0 text-[10px] text-gray-600 sm:inline">• Real-time sync via Yjs</span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          defaultValue={DEFAULT_CODE}
          theme="vs-dark"
          onMount={handleEditorMount}
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
