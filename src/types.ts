export type AssistantMode = 'chat' | 'tutorial' | 'troubleshoot' | 'quick-observe';

export type DesktopScenario = 'live' | 'vscode_error' | 'terminal_crash' | 'blender_3d' | 'cloud_console';

export interface VisualPin {
  id?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label?: string;
}

export interface PrivacyMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  imageBase64?: string;
  pins?: VisualPin[];
  mode?: AssistantMode;
  error?: boolean;
}

export interface TutorialStep {
  stepNumber: number;
  title: string;
  instructions: string;
  targetElement: string;
  pinCoordinates?: {
    x: number;
    y: number;
  };
  codeSnippetOrKey?: string;
  verificationHint: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  verificationFeedback?: string;
}

export interface StructuredTutorial {
  title: string;
  overview: string;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  detectedEnvironment?: string;
  steps: TutorialStep[];
  proTips?: string[];
}
