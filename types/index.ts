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
