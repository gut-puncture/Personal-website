"use client";

const prompts = [
  "What kind of role is Shailesh a fit for?",
  "Which projects best show product management and AI skills?",
  "Ask for details about any project."
];

function dispatchAssistantEvent(detail?: { prompt?: string; autoSubmit?: boolean }) {
  window.dispatchEvent(
    new CustomEvent("portfolio-assistant:open", {
      detail
    })
  );
}

export function VoiceGuideInvite() {
  return (
    <section className="edge-panel cut-corner relative overflow-hidden bg-[linear-gradient(180deg,rgba(12,16,23,0.92),rgba(7,9,13,0.96))] px-5 py-5 md:px-6 md:py-6">
      <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(184,116,53,0.08),transparent_24%,transparent_70%,rgba(184,116,53,0.06))]" />
      <div className="relative space-y-5">
        <div className="space-y-2">
          <p className="font-structure text-[11px] uppercase tracking-[0.34em] text-smoke-gray">
            Voice guide
          </p>
          <h2 className="max-w-sm text-2xl font-medium leading-tight tracking-tight text-bone-white md:text-[2rem]">
            Ask anything about the work.
          </h2>
          <p className="max-w-md text-sm leading-7 text-smoke-gray">
            Projects, recruiter fit, specifics, context, tradeoffs. Speak or type and get a direct answer from the portfolio guide.
          </p>
        </div>

        <div className="space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => dispatchAssistantEvent({ prompt, autoSubmit: true })}
              className="font-structure flex w-full items-center justify-between border border-line px-4 py-3 text-left text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:border-line-strong hover:bg-white/[0.02]"
            >
              <span>{prompt}</span>
              <span aria-hidden="true" className="text-ember-amber">
                /
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <p className="font-structure text-[11px] uppercase tracking-[0.28em] text-smoke-gray">
            Voice or text
          </p>
          <button
            type="button"
            onClick={() => dispatchAssistantEvent()}
            className="font-structure border border-bone-white/18 px-4 py-2 text-sm uppercase tracking-[0.12em] text-bone-white transition-colors hover:border-bone-white/32"
          >
            Open guide
          </button>
        </div>
      </div>
    </section>
  );
}
