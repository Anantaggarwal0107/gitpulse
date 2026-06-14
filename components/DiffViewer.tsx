"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface DiffViewerProps {
  diff: string;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="text-xs text-slate-400 ml-2 font-mono">diff</span>
      </div>
      <SyntaxHighlighter
        language="diff"
        style={vscDarkPlus}
        showLineNumbers
        wrapLines
        customStyle={{
          margin: 0,
          borderRadius: 0,
          maxHeight: "400px",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
      >
        {diff}
      </SyntaxHighlighter>
    </div>
  );
}
