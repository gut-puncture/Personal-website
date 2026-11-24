import ReactMarkdown from "react-markdown";

/** One paragraph of text that may contain emphasis or links. */
export function InlineMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p>{children}</p>,
        a: ({ href = "", children }) => (
          <a
            href={href}
            target={href.startsWith("/") ? undefined : "_blank"}
            rel={href.startsWith("/") ? undefined : "noreferrer"}
            className="text-link"
          >
            {children}
          </a>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
