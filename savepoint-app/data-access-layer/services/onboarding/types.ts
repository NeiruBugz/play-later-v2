export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  isDismissed: boolean;
  isComplete: boolean;
}

export type GetOnboardingProgressInput = {
  userId: string;
};

export type DismissOnboardingInput = {
  userId: string;
};
