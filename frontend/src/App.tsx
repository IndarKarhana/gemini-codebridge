import { VideoPanel } from "./components/VideoPanel/VideoPanel";
import { SharedEditor } from "./components/CodeEditor/SharedEditor";
import { CommunicationPanel } from "./components/CommunicationPanel/CommunicationPanel";
import { SessionControls } from "./components/SessionControls/SessionControls";

export function App() {
  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Top Bar */}
      <header className="flex h-12 items-center justify-between border-b border-gray-800 px-4">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-blue-400">Code</span>Bridge
        </h1>
        <SessionControls />
      </header>

      {/* Main Layout — 3 panels */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Video feeds */}
        <aside className="flex w-72 flex-col border-r border-gray-800">
          <VideoPanel />
        </aside>

        {/* Center: Code editor */}
        <section className="flex-1">
          <SharedEditor />
        </section>

        {/* Right: Communication panel */}
        <aside className="flex w-96 flex-col border-l border-gray-800">
          <CommunicationPanel />
        </aside>
      </main>
    </div>
  );
}
