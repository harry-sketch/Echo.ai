import { Modality } from "@google/genai";

export const model = "gemini-3.5-live-translate-preview";

export const config = {
  responseModalities: [Modality.AUDIO],
  translationConfig: {
    targetLanguageCode: "pl",
    echoTargetLanguage: true,
  },
};
