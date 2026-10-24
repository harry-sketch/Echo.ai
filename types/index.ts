import type { ConnectionService } from "@/services/connection-service";

export type TConectionType =
  | "disconnected"
  | "error"
  | "connecting"
  | "connected";

export interface IEchoState {
  connectionServiceInstance: ConnectionService | null;
  connectionState: TConectionType;
  error: string;
  onConect: () => Promise<void>;
}
