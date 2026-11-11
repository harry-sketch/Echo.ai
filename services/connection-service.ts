import type { LiveServerMessage, Session } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import {
  config,
  INPUT_SAMPLE_RATE,
  model,
  OUTPUT_SAMPLE_RATE,
} from "../lib/constants";
import {
  changeBase64To8Bit,
  createPcmBlob,
  decodeAudioData,
} from "../lib/utils";
import type { IConnectionServiceCallbacks } from "../types";

export class ConnectionService {
  private ai: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputGainNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private outputAudioWorkletNode: AudioWorkletNode | null = null;
  private inputMediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextPlayTime: number = 0;
  private callbacks: IConnectionServiceCallbacks;
  private inputTranscription: string = "";
  private outputTranscription: string = "";

  constructor(callbacks: IConnectionServiceCallbacks) {
    this.ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY,
    });
    this.callbacks = callbacks;
  }

  async startConnnectService() {
    try {
      this.callbacks.setConnectionState("connecting");

      this.session = await this.ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            console.log("Connection open with google gemini");
            this.callbacks.setConnectionState("connected");
          },
          onmessage: this.handleMessage.bind(this),

          onerror: (e) => {
            console.error(e);
            this.callbacks.setConnectionState("error");
            this.callbacks.onError("Error in connecting");
          },
          onclose: (e) => console.debug("Close:", e.reason),
        },
      });

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
          autoGainControl: true,
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
        const data = createPcmBlob(e.data as Float32Array);

        if (this.session) {
          this.session.sendRealtimeInput({
            audio: data,
          });
        }
      };

      this.inputMediaStreamSourceNode.connect(this.outputAudioWorkletNode);
    } catch (error) {
      console.error(error);
      this.callbacks.setConnectionState("error");
      this.callbacks.onError("Failed to connect via Websocket");
    }
  }

  handleMessage(e: LiveServerMessage) {
    const serverContent = e.serverContent;

    if (serverContent?.inputTranscription?.text) {
      this.inputTranscription += serverContent?.inputTranscription.text;
      this.callbacks.audioTranscription("user", this.inputTranscription, true);
    }

    if (serverContent?.outputTranscription?.text) {
      this.outputTranscription += serverContent?.outputTranscription.text;
      this.callbacks.audioTranscription(
        "model",
        this.outputTranscription,
        true,
      );
    }

    if (serverContent?.turnComplete) {
      if (this.inputTranscription) {
        this.callbacks.audioTranscription(
          "user",
          this.inputTranscription,
          false,
        );

        this.inputTranscription = "";
      }

      if (this.outputTranscription) {
        this.callbacks.audioTranscription(
          "model",
          this.outputTranscription,
          false,
        );

        this.outputTranscription = "";
      }
    }

    const data = serverContent?.modelTurn?.parts?.[0].inlineData?.data;

    const interuppted = serverContent?.interrupted;

    if (interuppted) {
      this.handleStopAudioChunk();
    }

    if (data) {
      this.handlePlayAudioChunk(data);
    }
  }

  handlePlayAudioChunk(data: string) {
    const unit8Array = changeBase64To8Bit(data);

    if (!this.outputAudioContext || !this.outputGainNode) return;

    const audioBuffer = decodeAudioData(unit8Array, this.outputAudioContext);

    if (this.nextPlayTime < this.outputAudioContext.currentTime) {
      this.nextPlayTime = this.outputAudioContext.currentTime;
    }

    const source = this.outputAudioContext.createBufferSource();

    source.buffer = audioBuffer;

    source.connect(this.outputGainNode);

    source.start(this.nextPlayTime);

    this.nextPlayTime += audioBuffer.duration;

    source.addEventListener("ended", () => {
      this.sources.delete(source);
    });

    this.sources.add(source);
  }

  handleStopAudioChunk() {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });

    this.sources.clear();

    if (this.outputAudioContext) {
      this.nextPlayTime = this.outputAudioContext?.currentTime;
    }
  }

  handleMute(isMuted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  handleDisconnect() {
    this.handleStopAudioChunk();
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.stop();
      });
    }

    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.inputMediaStreamSourceNode?.disconnect();
    this.outputAudioWorkletNode?.disconnect();
    this.outputAudioContext?.close();
    this.inputAudioContext?.close();
    this.outputGainNode?.disconnect();
    this.callbacks.setConnectionState("disconnected");
  }
}
