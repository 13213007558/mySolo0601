import type { Components, JSX } from "../types/components";

interface XmlExporter extends Components.XmlExporter, HTMLElement {}
export const XmlExporter: {
    prototype: XmlExporter;
    new (): XmlExporter;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
