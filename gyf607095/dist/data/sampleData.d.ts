export declare const sampleUsers: ({
    id: string;
    name: string;
    role: "reception";
    username: string;
} | {
    id: string;
    name: string;
    role: "therapist";
    username: string;
} | {
    id: string;
    name: string;
    role: "supervisor";
    username: string;
})[];
export declare const sampleChildren: {
    name: string;
    birthDate: string;
    guardianName: string;
    guardianPhone: string;
    balance: number;
}[];
export declare const sampleCourses: ({
    name: string;
    price: number;
    durationMinutes: number;
    type: "rehabilitation";
} | {
    name: string;
    price: number;
    durationMinutes: number;
    type: "cleaning";
} | {
    name: string;
    price: number;
    durationMinutes: number;
    type: "evaluation";
})[];
export declare const generateSampleSchedules: (baseDate?: string) => ({
    childIndex: number;
    courseIndex: number;
    therapistId: string;
    scheduledAt: string;
    status: "completed";
    isManualEntry: boolean;
    photos: {
        isMissing: boolean;
    }[];
    feedback: string;
    manualEntryReason?: undefined;
} | {
    childIndex: number;
    courseIndex: number;
    therapistId: string;
    scheduledAt: string;
    status: "completed";
    isManualEntry: boolean;
    manualEntryReason: string;
    photos: {
        isMissing: boolean;
    }[];
    feedback: string;
})[];
export declare const SAMPLE_DATA_FILE = "sample_rehabilitation_data_v1.json";
