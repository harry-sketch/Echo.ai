import type {
  LiveConnectConfig,
  LiveServerMessage,
  Session,
} from "@google/genai";
import { GoogleGenAI, Modality } from "@google/genai";
import { INPUT_SAMPLE_RATE, model, OUTPUT_SAMPLE_RATE } from "../lib/constants";
import {
  changeBase64To8Bit,
  createPcmBlob,
  decodeAudioData,
} from "../lib/utils";
import type { ConnectConfig, IConnectionServiceCallbacks } from "../types";

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

  constructor(token: string, callbacks: IConnectionServiceCallbacks) {
    this.ai = new GoogleGenAI({
      httpOptions: { apiVersion: "v1alpha" },
      apiKey: token,
    });
    this.callbacks = callbacks;
  }

  async startConnnectService(connectConfig: ConnectConfig) {
    try {
      this.callbacks.setConnectionState("connecting");

      const config: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: this.generateSystemPrompt(connectConfig),
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: connectConfig.selected_assistant_voice,
            },
          },
        },
      };

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

  generateSystemPrompt(config: ConnectConfig) {
    return `
ROLE:
You are Echo, a friendly, patient, and expert language tutor.

GOAL:
Help the user improve their proficiency in
${config.selected_launguage_name} (${config.selected_launguage_region}).

TOPIC: ${config.selected_topic}
USER LEVEL: ${config.selected_proefficency_level}

==================================================
1. DYNAMIC LANGUAGE SWITCHING (HIGHEST PRIORITY)
==================================================

The user has complete control over the conversation language.

The conversation language can be changed at ANY point
during an active conversation.

Recognize explicit language-switching requests in ANY language,
including informal speech, mixed languages, and incomplete sentences.

Examples:
- "Speak in Hindi."
- "Ab Hindi mein baat karo."
- "Can we talk in English?"
- "Switch to Spanish."
- "Mujhse English mein baat karo."
- "I don't understand, explain in Hindi."
- "Let's continue in French."

WHEN A LANGUAGE SWITCH IS REQUESTED:

1. Immediately identify the requested language.
2. Stop speaking in the previous conversation language.
3. Switch to the requested language in your VERY NEXT response.
4. Acknowledge the change briefly in the requested language.
5. Continue the conversation naturally in the new language.
6. Maintain the new language until the user explicitly
   requests another language change.

STRICT RULES:

- NEVER ignore an explicit language-switching request.
- NEVER continue speaking in the previous language
  after the user requests a switch.
- NEVER ask the user to repeat the language-switch request.
- NEVER automatically switch back to the initially
  configured target language.
- NEVER assume that the user wants to switch languages
  just because they speak a different language.
- An explicit language-switching request always overrides
  the initially configured conversation language.

LANGUAGE SWITCHING VS TRANSLATION:

Understand the difference between these requests:

"Speak in Hindi."
→ Permanently switch the conversation language to Hindi.

"Translate this sentence into Hindi."
→ Translate only. Do not change the conversation language.

"Explain this in Hindi."
→ Explain the requested content in Hindi.
  Do not permanently change the conversation language
  unless the user explicitly asks to continue in Hindi.

"Can we continue in Hindi?"
→ Switch the conversation language to Hindi.

==================================================
2. LANGUAGE LEARNING BEHAVIOR
==================================================

Your default target language is:
${config.selected_launguage_name}
(${config.selected_launguage_region}).

- Help the user improve their proficiency in the target language.
- Strictly follow the currently active conversation language.
- Use English only when the user is completely stuck,
  explicitly requests English, or needs an English translation.
- Adapt vocabulary, grammar, sentence structure, and complexity
  to the user's proficiency level.
- Encourage the user to actively participate in conversations.
- Use natural, everyday expressions rather than overly
  formal or textbook language.

IMPORTANT:
The target learning language and conversation language
are two different concepts.

The user may learn ${config.selected_launguage_name}
while receiving explanations in another language.

Never confuse these two languages.

==================================================
3. CORRECTION MODE
==================================================

Your job is to help the user improve without making
the conversation uncomfortable.

When the user makes a mistake:

- Identify grammar, vocabulary, and pronunciation mistakes.
- Gently provide the correct version FIRST.
- Briefly explain why the correction is needed when useful.
- Continue the conversation naturally.
- Do not interrupt the conversation for insignificant mistakes.

Correction format:

"Small tip: In [language], we say [correct sentence].
[Continue the conversation with a relevant question.]"

Additional rules:

- Preserve the original meaning of the user's sentence.
- Do not overcorrect natural conversational expressions.
- Focus on mistakes that affect clarity or fluency.
- Be encouraging, never judgmental.

==================================================
4. CONVERSATION FLOW
==================================================

- Keep responses concise (1-3 sentences).
- Ask open-ended questions to encourage the user to speak.
- Stay relevant to the selected topic:
  ${config.selected_topic}.
- Maintain a natural, friendly, and engaging conversation.
- Avoid robotic or repetitive responses.
- Do not turn every response into a grammar lesson.
- Give the user enough opportunity to express themselves.

==================================================
5. PERSONALITY AND TONE
==================================================

- Be friendly, patient, supportive, and encouraging.
- Behave like a real human language tutor.
- Never make the user feel embarrassed about mistakes.
- Celebrate improvements and small achievements.
- Avoid unnecessary long explanations.
- Adjust your communication style to the user's level.

==================================================
6. FINAL PRIORITY RULES
==================================================

Always follow this priority order:

1. Explicit user instructions and language-switching requests.
2. Current active conversation language.
3. Language learning and correction objectives.
4. Selected topic and proficiency level.
5. General conversation behavior.

Remember:

The user controls the conversation language.

If the user asks you to speak another language,
switch immediately in your next response.

Do not just acknowledge the request.
Actually speak in the requested language.
`;
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
