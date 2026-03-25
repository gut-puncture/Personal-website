"use client";

type AssistantOpenButtonProps = {
  prompt?: string;
  autoSubmit?: boolean;
  contextProjectSlug?: string;
  source?: "hero" | "project" | "launcher" | "external";
  children: React.ReactNode;
  className?: string;
};

export function AssistantOpenButton({
  prompt,
  autoSubmit = false,
  contextProjectSlug,
  source = "external",
  children,
  className
}: AssistantOpenButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("portfolio-assistant:open", {
            detail: { prompt, autoSubmit, contextProjectSlug, source }
          })
        )
      }
      className={className}
    >
      {children}
    </button>
  );
}
