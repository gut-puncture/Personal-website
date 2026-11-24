import type { AssistantTurnOrigin, ConversationState } from "@/lib/types";

export function createConversationId() {
  return crypto.randomUUID();
}

export function createEmptyConversationState(
  turnOrigin?: AssistantTurnOrigin
): ConversationState {
  return {
    focusProjectSlugs: [],
    turnOrigin: turnOrigin ?? null
  };
}

/** Accepts whatever the browser sent back, including state saved by an older version. */
export function normalizeConversationState(
  state?: Partial<ConversationState> | null,
  turnOrigin?: AssistantTurnOrigin
): ConversationState {
  const slugs = Array.isArray(state?.focusProjectSlugs)
    ? state.focusProjectSlugs.filter((slug): slug is string => typeof slug === "string" && Boolean(slug))
    : [];

  return {
    focusProjectSlugs: [...new Set(slugs)].slice(0, 3),
    turnOrigin: state?.turnOrigin ?? turnOrigin ?? null
  };
}
