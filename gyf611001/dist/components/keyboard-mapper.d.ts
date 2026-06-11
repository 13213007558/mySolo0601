import type { Components, JSX } from "../types/components";

interface KeyboardMapper extends Components.KeyboardMapper, HTMLElement {}
export const KeyboardMapper: {
    prototype: KeyboardMapper;
    new (): KeyboardMapper;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
