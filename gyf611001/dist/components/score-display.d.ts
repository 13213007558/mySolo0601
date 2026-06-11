import type { Components, JSX } from "../types/components";

interface ScoreDisplay extends Components.ScoreDisplay, HTMLElement {}
export const ScoreDisplay: {
    prototype: ScoreDisplay;
    new (): ScoreDisplay;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
