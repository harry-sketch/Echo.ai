import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { IEchoState } from "@/types";
import { ConnectionService } from "../services/connection-service";

export const useEchoStore = create<IEchoState>()(
  devtools((set, get) => ({
    connectionServiceInstance: null,
    connectionState: "disconnected",
    error: "",
    onConect: async () => {
      const state = get();

      const isConnecting = state.connectionState === "connecting";
      const isConnected = state.connectionState === "connected";

      if (isConnected || isConnecting) {
        return;
      }

      set({ error: "" });

      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch {
        set({ error: "Microphone Perimission Denied!!!!" });
      }

      // Info -==> Create s singleton Service pattern

      let connectionManager = state.connectionServiceInstance;

      if (!connectionManager) {
        connectionManager = new ConnectionService();
        set({
          connectionServiceInstance: connectionManager,
        });
      }

      connectionManager.startConnnectService();
    },
  })),
);
