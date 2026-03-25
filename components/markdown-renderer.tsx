import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugifyHeading } from "@/lib/utils";

function hasVisibleContent(node: ReactNode): boolean {
  if (typeof node === "string") return node.trim().length > 0;
  if (typeof node === "number") return true;
  if (!node) return false;
  if (Array.isArray(node)) return node.some((child) => hasVisibleContent(child));
  if (typeof node === "object" && "props" in node) {
    return hasVisibleContent((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return false;
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map((child) => textFromNode(child)).join("");
  if (typeof node === "object" && "props" in node) {
    return textFromNode((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

function splitMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  const current: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
    }

    if (!inFence && line.trim() === "") {
      if (current.length) {
        blocks.push(current.join("\n"));
        current.length = 0;
      }
      continue;
    }

    current.push(line);
  }

  if (current.length) {
    blocks.push(current.join("\n"));
  }

  return blocks;
}

function isImageOnlyBlock(block: string) {
  return /^!\[[^\]]*]\([^)]+\)$/.test(block.trim());
}

function buildImageTable(images: string[]) {
  const rows = [];
  for (let index = 0; index < images.length; index += 2) {
    rows.push([images[index], images[index + 1] ?? " "]);
  }

  return [
    "|  |  |",
    "| --- | --- |",
    ...rows.map(([left, right]) => `| ${left} | ${right} |`)
  ].join("\n");
}

function collapseImageRuns(markdown: string) {
  const blocks = splitMarkdownBlocks(markdown);
  const output: string[] = [];

  for (let index = 0; index < blocks.length; ) {
    if (!isImageOnlyBlock(blocks[index])) {
      output.push(blocks[index]);
      index += 1;
      continue;
    }

    const run: string[] = [];
    while (index < blocks.length && isImageOnlyBlock(blocks[index])) {
      run.push(blocks[index]);
      index += 1;
    }

    output.push(run.length > 1 ? buildImageTable(run) : run[0]);
  }

  return output.join("\n\n");
}

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  const preparedMarkdown = collapseImageRuns(markdown);

  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-4xl tracking-tight text-bone-white md:text-5xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = textFromNode(children);
            return (
              <h2
                id={slugifyHeading(text)}
                className="scroll-mt-24 border-t border-line pt-8 text-2xl font-medium tracking-tight text-bone-white md:text-3xl"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = textFromNode(children);
            return (
              <h3
                id={slugifyHeading(text)}
                className="scroll-mt-24 text-xl font-medium tracking-tight text-bone-white md:text-2xl"
              >
                {children}
              </h3>
            );
          },
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link
                href={href}
                className="font-medium text-bone-white underline decoration-current underline-offset-4"
              >
                {children}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-bone-white underline decoration-current underline-offset-4"
              >
                {children}
              </a>
            ),
          img: ({ src = "", alt = "" }) => (
            <img src={src} alt={alt} className="w-full rounded-[1rem] border border-line" />
          ),
          code: ({ className, children }) => (
            <code
              className={
                className
                  ? className
                  : "rounded bg-graphite-blue/80 px-1.5 py-0.5 text-[0.9em] text-bone-white"
              }
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-[1rem] border border-line bg-charcoal-steel p-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-[1rem] border border-line">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) =>
            hasVisibleContent(children) ? <thead>{children}</thead> : null,
          th: ({ children }) => <th className="px-4 py-3 text-left">{children}</th>,
          td: ({ children }) => <td className="align-top px-3 py-3">{children}</td>
        }}
      >
        {preparedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
