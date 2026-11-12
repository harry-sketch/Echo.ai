import type { ConnectionService } from "@/services/connection-service";

export type TConectionType =
  | "disconnected"
  | "error"
  | "connecting"
  | "connected";

export interface TTranscriptionItem {
  id: string;
  sender: "user" | "model";
  transcript: string;
  isPartial?: boolean;
}

export interface IEchoState {
  selectedLanguage: string;
  onLanguageSelect: (val: string) => void;
  selectedSkillLevel: string;
  onSkillSelect: (val: string) => void;
  selectedConversation: string;
  onConversationSelect: (val: string) => void;
  selectedVoice: string;
  onVoiceSelect: (val: string) => void;
  connectionServiceInstance: ConnectionService | null;
  connectionState: TConectionType;
  error: string | null;
  isMuted: boolean;
  toggleMute: () => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  transcription: TTranscriptionItem[];
}

export interface IConnectionServiceCallbacks {
  setConnectionState: (connectionState: TConectionType) => void;
  onError: (err: string) => void;
  audioTranscription: (
    sender: "user" | "model",
    transcript: string,
    isPartial: boolean,
  ) => void;
}

export interface ConnectConfig {
  selected_topic: string;
  description: string;

  selected_launguage_name: string;
  selected_launguage_code: string;
  selected_launguage_region: string;

  selected_proefficency_level: string;
  selected_assistant_voice: string;
}
