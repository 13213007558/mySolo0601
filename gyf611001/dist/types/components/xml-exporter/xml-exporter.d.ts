import { EventEmitter } from '../../stencil-public-runtime';
export declare class XmlExporter {
    boutState: any;
    associationEndpoint: string;
    autoUpload: boolean;
    exportComplete: EventEmitter<{
        xml: string;
        uploaded: boolean;
    }>;
    uploadFailed: EventEmitter<{
        error: string;
    }>;
    buildXml(): Promise<string>;
    download(): Promise<string>;
    uploadToAssociation(): Promise<boolean>;
    exportAndUpload(): Promise<{
        xml: string;
        uploaded: boolean;
    }>;
    render(): any;
}
