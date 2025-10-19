import { SignalsController } from "./SignalController";
import { SignalData, SvgSignalData } from "./ElementProps";

export class Signal<T = any> {
  private _origin = Object(Symbol());
  get value() {
    return this._value;
  }

  set value(newValue: T) {
    let oldValue = this._value;
    this._value = newValue;
    if (oldValue != newValue) {
      this.broadcast();
    }
  }

  get origin() {
    return this._origin;
  }
  constructor(private _value: T) {}

  setValue(value: T, doUpdate = true) {
    if (!doUpdate) {
      this._value = value;
      return;
    }
    this.value = value;
  }

  broadcast() {
    SignalsController.run(this._origin);
  }

  broadcastAsync() {
    SignalsController.runAsync(this._origin);
  }

  add<Tag extends keyof HTMLElementTagNameMap>(
    update: (elm: HTMLElementTagNameMap[Tag], data: T) => void
  ): SignalData<Tag> {
    return {
      origin: this._origin,
      update,
    };
  }

  addSVG<Tag extends keyof SVGElementTagNameMap>(
    update: (elm: SVGElementTagNameMap[Tag], data: T) => void
  ): SvgSignalData<Tag> {
    return {
      origin: this._origin,
      update,
    };
  }

  compose<Tag extends keyof HTMLElementTagNameMap>(
    update: (elm: HTMLElementTagNameMap[Tag], data: T) => void
  ): () => SignalData<Tag> {
    return () => this.add(update);
  }

  composeSVG<Tag extends keyof SVGElementTagNameMap>(
    update: (elm: SVGElementTagNameMap[Tag], data: T) => void
  ): () => SvgSignalData<Tag> {
    return () => this.addSVG(update);
  }
}

export function useSignal<T = any>(value: T = 0 as T): Signal<T> {
  return new Signal<T>(value);
}
