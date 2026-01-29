import { all, createLowlight } from "lowlight";
import { load } from "cheerio";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(all);

export async function highlightHtmlCodeBlocks(html: string): Promise<string> {
  const $ = load(html);

  $("pre code").each((_, element) => {
    const $code = $(element);
    const language =
      Array.from($code.attr("class")?.split(" ") || [])
        .find((cls) => cls.startsWith("language-"))
        ?.replace("language-", "") || "text";

    const code = $code.text();

    try {
      const highlighted = lowlight.highlight(language, code, {
        prefix: "hljs-",
      });
      $code.html(toHtml(highlighted));
      $code.attr("class", `hljs language-${language}`);
    } catch (error) {
      console.warn(`Failed to highlight ${language}:`, error);
      $code.attr("class", `hljs language-${language}`);
    }
  });

  return $.html();
}
