import type { LiveServerMessage, Session } from "@google/genai";
import { GoogleGenAI, Modality } from "@google/genai";

export class ConnectionService {
  private ai: GoogleGenAI;
  private session: Session | null = null;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: "",
    });
  }

  async startConnnectService() {
    const config = {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      translationConfig: {
        targetLanguageCode: "pl",
        echoTargetLanguage: true,
      },
    };

    this.session = await this.ai.live.connect({
      model: "",
      config,
      callbacks: {
        onopen: () => console.log("Connection open with google gemini"),
        onmessage: (e: LiveServerMessage) => {
          console.log({ e });
        },
      },
    });

    console.log("Session", this.session);
  }
}
