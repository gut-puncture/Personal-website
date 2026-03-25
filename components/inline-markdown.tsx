import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function InlineMarkdown({
  content,
  className = ""
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <>{children}</>,
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
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
