import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { IEchoState } from "@/types";

export const useEchoStore = create<IEchoState>()(
  devtools((set, get) => ({
    connectionState: "disconnected",
    error: "",
    onConect: async () => {
      const connectionState = get().connectionState;

      if (connectionState === "connecting" || connectionState === "connected") {
        return;
      }

      set({
        error: "",
      });
    },
  })),
);
