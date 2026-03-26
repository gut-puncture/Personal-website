import type { AssistantTurnOrigin, ConversationState } from "@/lib/types";

export function createConversationId() {
  return crypto.randomUUID();
}

export function createEmptyConversationState(
  turnOrigin?: AssistantTurnOrigin
): ConversationState {
  return {
    lastResolvedEntities: [],
    lastProjectSlugs: [],
    lastEvidenceIds: [],
    pendingSlots: [],
    lastDecision: null,
    lastVerifierVerdict: null,
    lastQuestionType: null,
    lastAnswerSummary: null,
    lastUserQuestion: null,
    lastAssistantAnswer: null,
    turnOrigin: turnOrigin ?? null
  };
}

export function normalizeConversationState(
  state?: ConversationState,
  turnOrigin?: AssistantTurnOrigin
): ConversationState {
  const initial = createEmptyConversationState(turnOrigin);
  if (!state) return initial;

  return {
    lastResolvedEntities: Array.isArray(state.lastResolvedEntities)
      ? [...new Set(state.lastResolvedEntities.filter(Boolean))]
      : [],
    lastProjectSlugs: Array.isArray(state.lastProjectSlugs)
      ? [...new Set(state.lastProjectSlugs.filter(Boolean))]
      : [],
    lastEvidenceIds: Array.isArray(state.lastEvidenceIds)
      ? [...new Set(state.lastEvidenceIds.filter(Boolean))]
      : [],
    pendingSlots: Array.isArray(state.pendingSlots)
      ? [...new Set(state.pendingSlots.filter(Boolean))]
      : [],
    lastDecision: state.lastDecision ?? null,
    lastVerifierVerdict: state.lastVerifierVerdict ?? null,
    lastQuestionType: state.lastQuestionType ?? null,
    lastAnswerSummary: state.lastAnswerSummary ?? null,
    lastUserQuestion: state.lastUserQuestion ?? null,
    lastAssistantAnswer: state.lastAssistantAnswer ?? null,
    turnOrigin: state.turnOrigin ?? turnOrigin ?? null
  };
}
