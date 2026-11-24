import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugifyHeading } from "@/lib/utils";

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map((child) => textFromNode(child)).join("");
  if (typeof node === "object" && "props" in node) {
    return textFromNode((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

const linkClass = "text-link font-medium break-words [overflow-wrap:anywhere]";

/** Renders a project page's body. Text keeps a readable line length; figures may run wider. */
export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert max-w-none min-w-0 text-[1.0625rem] leading-[1.75] break-words [&>*]:max-w-[44rem] [&>figure]:max-w-none [&>.wide]:max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              id={slugifyHeading(textFromNode(children))}
              className="mb-4 mt-12 border-t border-line pt-8 font-display text-[1.85rem] font-normal leading-[1.05] tracking-[-0.02em] text-bone-white md:text-[2.15rem]"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={slugifyHeading(textFromNode(children))}
              className="mb-3 mt-8 text-lg font-semibold tracking-tight text-bone-white"
            >
              {children}
            </h3>
          ),
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href} className={linkClass}>
                {children}
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
                {children}
              </a>
            ),
          // An image alone in a paragraph becomes a figure; a video uses the same syntax.
          p: ({ children, node }) => {
            const onlyChild =
              node?.children.length === 1 && node.children[0].type === "element"
                ? node.children[0]
                : null;
            if (onlyChild?.tagName === "img") {
              return <figure className="not-prose my-8">{children}</figure>;
            }
            return <p>{children}</p>;
          },
          img: ({ src, alt = "" }) => {
            const source = typeof src === "string" ? src : "";
            if (/\.(mp4|webm)$/i.test(source)) {
              return (
                <video
                  src={source}
                  controls
                  preload="metadata"
                  aria-label={alt}
                  className="max-h-[34rem] w-auto max-w-full border border-line bg-black"
                />
              );
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={source}
                alt={alt}
                loading="lazy"
                className="max-h-[40rem] w-auto max-w-full border border-line bg-[#f7f5f2]"
              />
            );
          },
          code: ({ className, children }) => (
            <code
              className={
                className ?? "bg-graphite-blue px-1.5 py-0.5 text-[0.9em] text-bone-white"
              }
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto border border-line bg-charcoal-steel p-4 text-sm">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="wide not-prose my-8 overflow-x-auto border border-line">
              <table className="w-full border-collapse text-left text-[0.95rem] leading-6">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="kicker border-b border-line-strong px-4 py-3 font-normal">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-line px-4 py-3 align-top text-bone-white/90">{children}</td>
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
