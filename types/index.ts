import type { ConnectionService } from "@/services/connection-service";

export type TConectionType =
  | "disconnected"
  | "error"
  | "connecting"
  | "connected";

export interface IEchoState {
  connectionServiceInstance: ConnectionService | null;
  connectionState: TConectionType;
  error: string | null;
  isMuted: boolean;
  toggleMute: () => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export interface IConnectionServiceCallbacks {
  setConnectionState: (connectionState: TConectionType) => void;
  onError: (err: string) => void;
}
