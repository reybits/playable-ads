export interface TweenOpts {
  easing?: (t: number) => number;
  delay?: number;
  onComplete?: () => void;
}

interface ActiveTween {
  target: Record<string, number>;
  from: Record<string, number>;
  to: Record<string, number>;
  duration: number;
  elapsed: number;
  delay: number;
  easing: (t: number) => number;
  onComplete?: () => void;
}

export interface TweenManager {
  add(
    target: Record<string, number>,
    props: Record<string, number>,
    duration: number,
    opts?: TweenOpts,
  ): ActiveTween;
  update(dt: number): void;
  clear(): void;
}

export const Ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => --t * t * t + 1,
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  inBack: (t: number) => t * t * (2.70158 * t - 1.70158),
  outBack: (t: number) => --t * t * (2.70158 * t + 1.70158) + 1,
  outElastic: (t: number) =>
    t === 0 || t === 1
      ? t
      : Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1,
};

export function createTweenManager(): TweenManager {
  const tweens: ActiveTween[] = [];

  return {
    add(
      target: Record<string, number>,
      props: Record<string, number>,
      duration: number,
      opts: TweenOpts = {},
    ): ActiveTween {
      const from: Record<string, number> = {};
      for (const key of Object.keys(props)) {
        from[key] = target[key] ?? 0;
      }
      const tw: ActiveTween = {
        target,
        from,
        to: { ...props },
        duration,
        elapsed: 0,
        delay: opts.delay ?? 0,
        easing: opts.easing ?? Ease.outQuad,
        onComplete: opts.onComplete,
      };
      tweens.push(tw);
      return tw;
    },

    update(dt: number) {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        if (tw.delay > 0) {
          tw.delay -= dt;
          continue;
        }
        tw.elapsed += dt;
        const progress = Math.min(tw.elapsed / tw.duration, 1);
        const t = tw.easing(progress);
        for (const key of Object.keys(tw.to)) {
          tw.target[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * t;
        }
        if (progress >= 1) {
          tweens.splice(i, 1);
          tw.onComplete?.();
        }
      }
    },

    clear() {
      tweens.length = 0;
    },
  };
}
