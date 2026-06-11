import { EventEmitter } from '../../stencil-public-runtime';
export interface PinValidationResult {
    authorized: boolean;
    referee1Name?: string;
    referee2Name?: string;
    timestamp?: number;
}
interface RefereeAccount {
    pin: string;
    name: string;
}
export declare class PinValidator {
    requiredReferees: number;
    panelTitle: string;
    accounts: RefereeAccount[];
    open: boolean;
    validated: EventEmitter<PinValidationResult>;
    cancelled: EventEmitter<void>;
    pin1: string;
    pin2: string;
    pin1Valid: boolean | null;
    pin2Valid: boolean | null;
    error: string;
    focusedField: 1 | 2;
    reset(): Promise<void>;
    private handlePinInput;
    private submit;
    private cancel;
    render(): any;
}
export {};
