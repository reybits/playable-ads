export interface SoundManager {
  load(name: string, data: ArrayBuffer): Promise<void>;
  play(name: string, opts?: PlayOpts): void;
  stop(name: string): void;
  unlock(): void;
}

export interface PlayOpts {
  loop?: boolean;
  volume?: number;
}

export function createSoundManager(): SoundManager {
  let ctx: AudioContext | null = null;
  const buffers = new Map<string, AudioBuffer>();
  const sources = new Map<string, AudioBufferSourceNode>();

  function getContext(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
    }
    return ctx;
  }

  return {
    async load(name: string, data: ArrayBuffer) {
      const audioCtx = getContext();
      const buffer = await audioCtx.decodeAudioData(data.slice(0));
      buffers.set(name, buffer);
    },

    play(name: string, opts: PlayOpts = {}) {
      const buffer = buffers.get(name);
      if (!buffer) return;
      const audioCtx = getContext();
      if (audioCtx.state === 'suspended') return;

      // Stop previous instance
      const prev = sources.get(name);
      if (prev) {
        try { prev.stop(); } catch { /* ignore */ }
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = opts.loop ?? false;

      const gain = audioCtx.createGain();
      gain.gain.value = opts.volume ?? 1;

      source.connect(gain).connect(audioCtx.destination);
      source.start();
      sources.set(name, source);

      source.onended = () => {
        if (sources.get(name) === source) {
          sources.delete(name);
        }
      };
    },

    stop(name: string) {
      const source = sources.get(name);
      if (source) {
        try { source.stop(); } catch { /* ignore */ }
        sources.delete(name);
      }
    },

    unlock() {
      const audioCtx = getContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    },
  };
}
