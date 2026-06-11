import type { Components, JSX } from "../types/components";

interface CountdownTimer extends Components.CountdownTimer, HTMLElement {}
export const CountdownTimer: {
    prototype: CountdownTimer;
    new (): CountdownTimer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
