import type { Components, JSX } from "../types/components";

interface PinValidator extends Components.PinValidator, HTMLElement {}
export const PinValidator: {
    prototype: PinValidator;
    new (): PinValidator;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
