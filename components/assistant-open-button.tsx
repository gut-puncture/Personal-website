"use client";

type AssistantOpenButtonProps = {
  prompt?: string;
  autoSubmit?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function AssistantOpenButton({
  prompt,
  autoSubmit = false,
  children,
  className
}: AssistantOpenButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("portfolio-assistant:open", {
            detail: { prompt, autoSubmit }
          })
        )
      }
      className={className}
    >
      {children}
    </button>
  );
}
