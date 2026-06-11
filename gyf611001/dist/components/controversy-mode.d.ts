import type { Components, JSX } from "../types/components";

interface ControversyMode extends Components.ControversyMode, HTMLElement {}
export const ControversyMode: {
    prototype: ControversyMode;
    new (): ControversyMode;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
