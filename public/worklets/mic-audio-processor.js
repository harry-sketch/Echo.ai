// random-noise-processor.js
class MicAudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    if (!inputs.length) return true;

    const input = inputs[0];

    if (!input.length) return true;

    const channelInput = input[0];

    const pcm = new Float32Array(channelInput.length);

    pcm.set(channelInput);

    this.port.postMessage(pcm);

    return true;
  }
}

registerProcessor("mic-audio-processor", MicAudioProcessor);
