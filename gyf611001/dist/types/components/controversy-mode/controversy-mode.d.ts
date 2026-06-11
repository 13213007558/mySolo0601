import { EventEmitter } from '../../stencil-public-runtime';
import { TouchRecord } from '../../utils/types';
export declare class ControversyMode {
    active: boolean;
    touches: TouchRecord[];
    maxLookback: number;
    exitRequested: EventEmitter<void>;
    annotationAdded: EventEmitter<{
        touchId: string;
        text: string;
    }>;
    selectedIndex: number;
    annotationText: string;
    resetSelection(): Promise<void>;
    private get recentTouches();
    private selectTouch;
    private submitAnnotation;
    private formatTs;
    private sideLabel;
    private typeLabel;
    render(): any;
}
