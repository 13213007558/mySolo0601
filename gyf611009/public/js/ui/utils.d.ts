type ElAttribs = Record<string, string | boolean | number>;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: ElAttribs, children?: Array<HTMLElement | Text | string | null | undefined>): HTMLElementTagNameMap[K];
export declare function t(s: string): Text;
export declare function clear(el: HTMLElement): void;
export declare function formatTime(ts: number): string;
export declare function formatDateTime(ts: number): string;
export declare function actionLabel(a: string): string;
export {};
