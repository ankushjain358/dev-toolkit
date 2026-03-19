"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const contentContainer = document.querySelector(".blog-content");
    if (!contentContainer) return;

    const headings = contentContainer.querySelectorAll("h1, h2, h3");
    const tocItems: TocItem[] = [];

    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;

      tocItems.push({
        id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1)),
      });
    });

    setItems(tocItems);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24 hidden lg:block">
      <div className="border rounded-lg p-5 bg-card max-h-[calc(100vh-8rem)] overflow-y-auto w-72">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          On This Page
        </h3>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              className="mb-3"
              key={item.id}
              style={{
                paddingLeft:
                  item.level === 1 ? "0" : `${(item.level - 1) * 1}rem`,
              }}
            >
              <button
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={`text-left w-full hover:text-blue-500 hover: transition-all cursor-pointer ${
                  activeId === item.id
                    ? "text-blue-500 !font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
