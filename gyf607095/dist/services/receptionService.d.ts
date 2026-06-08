import { ReceptionStep, User } from '../types';
export declare class ReceptionService {
    initSteps(): void;
    getSteps(user: User): ReceptionStep[];
    getStepByOrder(user: User, order: number): ReceptionStep | undefined;
    validateStepCompletion(user: User, order: number, data: any): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}
export declare const receptionService: ReceptionService;
