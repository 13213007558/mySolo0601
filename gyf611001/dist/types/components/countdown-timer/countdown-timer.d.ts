import { EventEmitter } from '../../stencil-public-runtime';
export declare class CountdownTimer {
    initialSeconds: number;
    fullscreen: boolean;
    autoStart: boolean;
    label: string;
    timerEnded: EventEmitter<void>;
    timerTick: EventEmitter<number>;
    remaining: number;
    running: boolean;
    private intervalId;
    componentWillLoad(): void;
    disconnectedCallback(): void;
    onInitialChange(val: number): void;
    start(): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    private clearTimer;
    render(): any;
}
