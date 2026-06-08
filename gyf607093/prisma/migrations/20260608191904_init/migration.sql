-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "babies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "idCard" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "medicalRecord" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "classes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "therapistId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "classes_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "babyId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "enrollDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "class_enrollments_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "classId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "actualDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disinfection_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "disinfection_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "babyId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "borrowTime" DATETIME,
    "returnTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scanResult" TEXT,
    "createdById" INTEGER NOT NULL,
    "handledById" INTEGER,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "manualEntryNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "disinfection_records_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "disinfection_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disinfection_records_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disinfection_records_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disinfection_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disinfection_records_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "anomaly_resolutions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" INTEGER NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "handledById" INTEGER NOT NULL,
    "handledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partialSuccess" BOOLEAN NOT NULL DEFAULT false,
    "affectedClasses" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "anomaly_resolutions_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "disinfection_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "anomaly_resolutions_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" INTEGER NOT NULL,
    "classPageSynced" BOOLEAN NOT NULL DEFAULT false,
    "babyDetailSynced" BOOLEAN NOT NULL DEFAULT false,
    "backendSynced" BOOLEAN NOT NULL DEFAULT false,
    "exportSynced" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "syncError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sync_status_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "disinfection_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "babyId" INTEGER NOT NULL,
    "courseId" INTEGER,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "feedbacks_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER,
    "babyId" INTEGER,
    "classId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "isUnauthorized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "export_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "exportType" TEXT NOT NULL,
    "filters" TEXT,
    "recordCount" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "privacy_fields" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableName" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "requiredRoles" TEXT NOT NULL,
    "maskPattern" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "babies_idCard_key" ON "babies"("idCard");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_babyId_classId_key" ON "class_enrollments"("babyId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "disinfection_items_barcode_key" ON "disinfection_items"("barcode");

-- CreateIndex
CREATE INDEX "disinfection_records_babyId_classId_idx" ON "disinfection_records"("babyId", "classId");

-- CreateIndex
CREATE INDEX "disinfection_records_status_idx" ON "disinfection_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_resolutions_recordId_key" ON "anomaly_resolutions"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_status_recordId_key" ON "sync_status"("recordId");

-- CreateIndex
CREATE INDEX "feedbacks_babyId_isLatest_idx" ON "feedbacks"("babyId", "isLatest");

-- CreateIndex
CREATE INDEX "feedbacks_babyId_version_idx" ON "feedbacks"("babyId", "version");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_babyId_action_idx" ON "audit_logs"("babyId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_fields_tableName_fieldName_key" ON "privacy_fields"("tableName", "fieldName");
