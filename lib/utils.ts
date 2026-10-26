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

export const createBuffer = (data: Int16Array) => {
  const buffer = new Uint8Array(data.buffer);

  let string: string = "";

  for (let i = 0; i < buffer.byteLength; i++) {
    string += String.fromCharCode(buffer[i]);
  }

  return btoa(string);
};
