// TODO: This can be an open source project.
abstract class CustomEventTarget<T extends { [K: string]: Event }> extends EventTarget {
  override addEventListener<K extends string>(
    type: K,
    listener: ((this: this, event: K extends keyof T ? T[K] : Event) => void) | EventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject | null, options);
  }

  override removeEventListener<K extends string>(
    type: K,
    listener: ((this: this, event: K extends keyof T ? T[K] : Event) => void) | EventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener as EventListenerOrEventListenerObject | null, options);
  }

  override dispatchEvent<K extends keyof T>(event: T[K]): boolean;

  override dispatchEvent(event: Event): boolean;

  override dispatchEvent(event: Event): boolean {
    return super.dispatchEvent(event);
  }
}

export default CustomEventTarget;
