import { create } from 'zustand';
import type { QuestionResponse } from '@partiprism/shared';

type OnboardingPhase = 'intro' | 'phase1' | 'fracture' | 'phase3' | 'result';

interface OnboardingState {
  phase: OnboardingPhase;
  currentQuestionIndex: number;
  responses: QuestionResponse[];

  setPhase: (phase: OnboardingPhase) => void;
  nextQuestion: () => void;
  addResponse: (response: QuestionResponse) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  phase: 'intro',
  currentQuestionIndex: 0,
  responses: [],

  setPhase: (phase) => set({ phase }),

  nextQuestion: () =>
    set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),

  addResponse: (response) =>
    set((state) => ({ responses: [...state.responses, response] })),

  reset: () =>
    set({ phase: 'intro', currentQuestionIndex: 0, responses: [] }),
}));
