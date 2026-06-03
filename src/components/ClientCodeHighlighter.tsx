"use client";

import { useEffect, useRef } from "react";
import { all, createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(all);

interface ClientCodeHighlighterProps {
  html: string;
}

export default function ClientCodeHighlighter({
  html,
}: ClientCodeHighlighterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((code) => {
      const classNames = code.className.split(/\s+/);
      const language =
        classNames
          .find((cls) => cls.startsWith("language-"))
          ?.replace("language-", "") || "text";
      const codeText = code.textContent ?? "";

      try {
        const highlighted = lowlight.highlight(language, codeText, {
          prefix: "hljs-",
        });
        code.innerHTML = toHtml(highlighted);
      } catch (error) {
        console.warn("Failed to highlight code block", error);
      }

      code.className = `hljs language-${language}`;
    });
  }, [html]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
