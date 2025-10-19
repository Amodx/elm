type KeyFrames = PropertyIndexedKeyframes | Keyframe[];
type Options = number | KeyframeAnimationOptions | undefined;

const animateObject = {
  fadeIn: (element: HTMLElement, options: Options) =>
    animate(
      element,
      [
        {
          opacity: 0,
        },
        {
          opacity: 1,
        },
      ],
      options
    ),
  fadeOut: (element: HTMLElement, options: Options) =>
    animate(
      element,
      [
        {
          opacity: 1,
        },
        {
          opacity: 0,
        },
      ],
      options
    ),
};

export const animate = Object.assign(
  (element: HTMLElement, keyframes: KeyFrames, options?: Options) => {
    return new Promise((resolve) => {
      element.animate(keyframes, options).onfinish = () => resolve(true);
    });
  },
  animateObject
);

class ElementAnimation {
  private animation: Animation;

  constructor(animation: Animation) {
    this.animation = animation;
  }

  async playAndWait() {
    this.animation.play();
    await this.animation.finished;
    this.animation.cancel();
  }

  play(): this {
    this.animation.play();
    return this;
  }

  pause(): this {
    this.animation.pause();
    return this;
  }

  cancel(): this {
    this.animation.cancel();
    return this;
  }

  finish(): this {
    this.animation.finish();
    return this;
  }
  reverse(): this {
    this.animation.reverse();
    return this;
  }
  get playbackRate(): number {
    return this.animation.playbackRate;
  }
  set playbackRate(rate: number) {
    this.animation.playbackRate = rate;
  }
  async finished(): Promise<void> {
    await this.animation.finished;
  }
  get isRunning(): boolean {
    return this.animation.playState === "running";
  }
  get native(): Animation {
    return this.animation;
  }
}

export function animateElement(
  element: HTMLElement,
  keyframes: KeyFrames,
  options?: Options
) {
  return new ElementAnimation(element.animate(keyframes, options));
}
