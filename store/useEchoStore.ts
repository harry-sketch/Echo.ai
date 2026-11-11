import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { IEchoState } from "@/types";
import { ConnectionService } from "../services/connection-service";

export const useEchoStore = create<IEchoState>()(
  devtools((set, get) => ({
    connectionServiceInstance: null,
    connectionState: "disconnected",
    error: null,
    isMuted: false,
    toggleMute: () => {
      const state = get();
      const currState = !state.isMuted;

      state.connectionServiceInstance?.handleMute(currState);

      set({ isMuted: currState });
    },
    onConnect: async () => {
      const state = get();

      const isConnecting = state.connectionState === "connecting";
      const isConnected = state.connectionState === "connected";

      if (isConnected || isConnecting) {
        return;
      }

      set({ error: null });

      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch {
        set({ error: "Microphone Perimission Denied!!!!" });
      }

      // Info -==> Create a singleton Service pattern

      let connectionManager = state.connectionServiceInstance;

      if (!connectionManager) {
        connectionManager = new ConnectionService({
          setConnectionState: (connectionState) => set({ connectionState }),
          onError: (err) => set({ error: err }),
        });
        set({
          connectionServiceInstance: connectionManager,
        });
      }

      await connectionManager.startConnnectService();
    },

    onDisconnect: () => {
      const state = get();

      if (state.connectionServiceInstance) {
        state.connectionServiceInstance.handleDisconnect();
      }

      set({
        connectionServiceInstance: undefined,
        connectionState: "disconnected",
      });
    },
  })),
);
