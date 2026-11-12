import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { IEchoState } from "@/types";
import { ConnectionService } from "../services/connection-service";
import {
  AVAILABLE_LANGUAGES,
  AVAILABLE_PROFICIENCY_LEVELS,
  AVAILABLE_TOPICS,
  AVAILABLE_VOICES,
} from "../lib/constants";

export const useEchoStore = create<IEchoState>()(
  devtools((set, get) => ({
    selectedConversation: AVAILABLE_TOPICS[0],
    onConversationSelect: (val) => {
      set({ selectedConversation: val });
    },

    selectedLanguage: AVAILABLE_LANGUAGES[0].code,
    onLanguageSelect: (val) => {
      set({ selectedLanguage: val });
    },

    selectedSkillLevel: AVAILABLE_PROFICIENCY_LEVELS[0].label,
    onSkillSelect: (val) => {
      set({ selectedSkillLevel: val });
    },

    selectedVoice: AVAILABLE_VOICES[0].name,
    onVoiceSelect: (val) => {
      set({ selectedVoice: val });
    },

    transcription: [],
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
          audioTranscription: (sender, transcript, isPartial) => {
            return set((state) => {
              const newTranscript = [...state.transcription];

              const isPartialIndex = newTranscript.findLastIndex(
                (item) => item.sender === sender && item.isPartial,
              );

              if (isPartialIndex !== -1) {
                newTranscript[isPartialIndex] = {
                  ...newTranscript[isPartialIndex],
                  transcript,
                  isPartial,
                };

                return { transcription: newTranscript };
              } else {
                if (transcript) {
                  newTranscript.push({
                    id: crypto.randomUUID(),
                    sender,
                    transcript,
                    isPartial,
                  });
                }

                return { transcription: newTranscript };
              }
            });
          },
        });

        set({
          connectionServiceInstance: connectionManager,
        });
      }

      const selectedLang = AVAILABLE_LANGUAGES.find(
        (lang) => lang.code === state.selectedLanguage,
      );

      await connectionManager.startConnnectService({
        selected_assistant_voice: state.selectedVoice,
        selected_launguage_code: selectedLang?.code || "en-US",
        selected_launguage_name: selectedLang?.name || "English",
        selected_launguage_region: selectedLang?.region || "US",
        description: state.selectedConversation,
        selected_topic: state.selectedConversation,
        selected_proefficency_level: state.selectedSkillLevel,
      });
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
