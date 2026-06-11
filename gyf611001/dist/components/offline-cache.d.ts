import type { Components, JSX } from "../types/components";

interface OfflineCache extends Components.OfflineCache, HTMLElement {}
export const OfflineCache: {
    prototype: OfflineCache;
    new (): OfflineCache;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
