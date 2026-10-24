export type TConectionType =
  | "disconnected"
  | "error"
  | "connecting"
  | "connected";

export interface IEchoState {
  connectionState: TConectionType;
  error: string;
  onConect: () => void;
}
