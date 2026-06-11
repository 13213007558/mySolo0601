import type { Components, JSX } from "../types/components";

interface RefereePanel extends Components.RefereePanel, HTMLElement {}
export const RefereePanel: {
    prototype: RefereePanel;
    new (): RefereePanel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
