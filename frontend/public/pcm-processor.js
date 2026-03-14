/**
 * AudioWorklet processor - outputs raw Float32 PCM from the microphone.
 * Used for sending audio to Gemini Live API (16kHz, 16-bit PCM).
 */
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channel = input[0];
      if (channel && channel.length > 0) {
        this.port.postMessage(channel);
      }
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
