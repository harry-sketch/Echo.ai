import { OUTPUT_SAMPLE_RATE } from "./constants";

export { cn } from "cn";

export const createPcmBlob = (data: Float32Array) => {
  const int16BitArray = new Int16Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const currEle = data[i];

    const element = Math.max(-1, Math.min(1, currEle));

    int16BitArray[i] = element < 0 ? element * 32768 : element * 32767;
  }

  return {
    data: createBuffer(int16BitArray),
    mimeType: "audio/pcm;rate=16000",
  };
};

export const createBuffer = (data: Int16Array): string => {
  const buffer = new Uint8Array(data.buffer);

  let string: string = "";

  for (let i = 0; i < buffer.byteLength; i++) {
    string += String.fromCharCode(buffer[i]);
  }

  return btoa(string);
};

// Todo: - > base 64 => Uint8Array =>
export const changeBase64To8Bit = (data: string): Uint8Array => {
  const binaryString = atob(data);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

export const decodeAudioData = (
  unit8Array: Uint8Array,
  ctx: AudioContext,
  numofChannel: number,
): AudioBuffer => {
  const int16ArrayBuffer = new Int16Array(unit8Array.buffer);

  const frameCount = int16ArrayBuffer.length / numofChannel;

  const audioBuffer = ctx.createBuffer(
    numofChannel,
    frameCount,
    OUTPUT_SAMPLE_RATE,
  );

  for (let channel = 0; channel < numofChannel; channel++) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let i = 0; i < frameCount; i++) {
      channelData[i] = int16ArrayBuffer[i * numofChannel + channel] / 32768.0;
    }
  }

  return audioBuffer;
};
