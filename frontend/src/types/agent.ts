export interface CodeReference {
  entityType: "function" | "variable" | "class" | "line_range" | "file";
  name: string;
  file: string;
  lineRange: [number, number];
}

export interface CaptionMessage {
  type: "caption";
  speaker: "hearing_dev" | "deaf_dev";
  text: string;
  codeReferences: CodeReference[];
  confidence: number;
  timestamp: string;
}

export interface CodeHighlightMessage {
  type: "code_highlight";
  file: string;
  lineStart: number;
  lineEnd: number;
  style: "reference" | "suggestion" | "warning";
  label?: string;
  durationMs: number;
}

export interface DisambiguationMessage {
  type: "disambiguation";
  question: string;
  options: Array<{
    label: string;
    codeReference?: CodeReference;
    confidence: number;
  }>;
}

export type AgentMessage =
  | CaptionMessage
  | CodeHighlightMessage
  | DisambiguationMessage;
