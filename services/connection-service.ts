import type { LiveServerMessage, Session } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { config, model } from "../lib/constants";

export class ConnectionService {
  private ai: GoogleGenAI;
  private session: Session | null = null;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY,
    });
  }

  async startConnnectService() {
    this.session = await this.ai.live.connect({
      model,
      config,
      callbacks: {
        onopen: () => console.log("Connection open with google gemini"),
        onmessage: (e: LiveServerMessage) => {
          console.log({ e });
        },

        onerror: (e) => console.debug("Error:", e.message),
        onclose: (e) => console.debug("Close:", e.reason),
      },
    });

    console.log("Session", this.session);
  }
}
