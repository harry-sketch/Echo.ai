import type { LiveServerMessage, Session } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import {
  config,
  INPUT_SAMPLE_RATE,
  model,
  OUTPUT_SAMPLE_RATE,
} from "../lib/constants";

export class ConnectionService {
  private ai: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputGainNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private outputAudioWorkletNode: AudioWorkletNode | null = null;
  private inputMediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;

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

    console.log(this.session);

    this.inputAudioContext = new AudioContext({
      sampleRate: INPUT_SAMPLE_RATE,
    });

    this.outputAudioContext = new AudioContext({
      sampleRate: OUTPUT_SAMPLE_RATE,
    });

    if (this.inputAudioContext.state === "suspended") {
      this.inputAudioContext.resume();
    }

    if (this.outputAudioContext.state === "suspended") {
      this.outputAudioContext.resume();
    }

    this.outputGainNode = this.outputAudioContext.createGain();

    this.outputGainNode.connect(this.outputAudioContext.destination);

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: INPUT_SAMPLE_RATE,
      },
    });

    this.inputMediaStreamSourceNode =
      this.inputAudioContext.createMediaStreamSource(this.mediaStream);

    await this.inputAudioContext.audioWorklet.addModule(
      "/worklets/mic-audio-processor.js",
    );

    this.outputAudioWorkletNode = new AudioWorkletNode(
      this.inputAudioContext,
      "mic-audio-processor",
    );

    this.outputAudioWorkletNode.port.onmessage = (e) => {
      console.log("RECEIVED", e.data);
    };

    this.inputMediaStreamSourceNode.connect(this.outputAudioWorkletNode);
  }
}
