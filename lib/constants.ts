import { Modality } from "@google/genai";

export const model = "gemini-3.5-live-translate-preview";

export const config = {
  responseModalities: [Modality.AUDIO],
  translationConfig: {
    targetLanguageCode: "pl",
    echoTargetLanguage: true,
  },
};

export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 32000;
