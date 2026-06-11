import { EventEmitter } from '../../stencil-public-runtime';
import { KeyboardAction, KeyboardMapping } from '../../utils/types';
export declare class KeyboardMapper {
    mapping: KeyboardMapping;
    disabled: boolean;
    actionFired: EventEmitter<KeyboardAction>;
    lastKey: string;
    lastAction: KeyboardAction | null;
    handleKeyDown(ev: KeyboardEvent): void;
    private normalizeKey;
    render(): any;
}
