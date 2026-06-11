import { EventEmitter } from '../../stencil-public-runtime';
export declare class OfflineCache {
    uploadEndpoint: string;
    cachedLoaded: EventEmitter<any>;
    syncComplete: EventEmitter<{
        success: number;
        failed: number;
    }>;
    isOnline: boolean;
    cachedCount: number;
    queueCount: number;
    componentWillLoad(): void;
    private refreshCounts;
    private handleOnline;
    saveBout(boutId: string, state: any): Promise<boolean>;
    loadBout(boutId: string): Promise<any | null>;
    removeBout(boutId: string): Promise<boolean>;
    listBouts(): Promise<Array<{
        id: string;
        savedAt: number;
    }>>;
    queueUpload(payload: any): Promise<void>;
    syncQueue(): Promise<{
        success: number;
        failed: number;
    }>;
    clearAll(): Promise<void>;
    render(): any;
}
