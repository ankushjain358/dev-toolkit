"use client";

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
} from "@tiptap/react";
import React from "react";

export default function CodeBlockComponent(props: ReactNodeViewProps) {
  const language = (props.node.attrs.language as string | null) || null;

  return (
    <NodeViewWrapper className="code-block">
      <select
        contentEditable={false}
        value={language || "null"}
        onChange={(event) =>
          props.updateAttributes({
            language: event.target.value === "null" ? null : event.target.value,
          })
        }
        className="absolute right-2 top-2 px-2 py-1 bg-background border border-border rounded text-sm"
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {(props.extension.options.lowlight as any)
          .listLanguages()
          .map((lang: string, index: number) => (
            <option key={index} value={lang}>
              {lang}
            </option>
          ))}
      </select>
      <pre>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
