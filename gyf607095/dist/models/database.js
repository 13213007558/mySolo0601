"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
class Database {
    constructor() {
        this.users = new Map();
        this.children = new Map();
        this.courses = new Map();
        this.schedules = new Map();
        this.photos = new Map();
        this.writeOffRecords = new Map();
        this.auditLogs = [];
        this.balanceTransactions = new Map();
        this.importBatches = new Map();
        this.receptionSteps = new Map();
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    clear() {
        this.users.clear();
        this.children.clear();
        this.courses.clear();
        this.schedules.clear();
        this.photos.clear();
        this.writeOffRecords.clear();
        this.auditLogs = [];
        this.balanceTransactions.clear();
        this.importBatches.clear();
        this.receptionSteps.clear();
    }
}
exports.Database = Database;
exports.db = Database.getInstance();
//# sourceMappingURL=database.js.map