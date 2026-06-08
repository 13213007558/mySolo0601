-- CreateTable
CREATE TABLE "Child" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "guardianName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "childId" INTEGER NOT NULL,
    "recordDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "parentMessage" TEXT,
    "paperNote" TEXT,
    "reason" TEXT,
    "handledBy" TEXT,
    "handledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MilkRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MilkRecordHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" INTEGER NOT NULL,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "oldAmount" INTEGER,
    "newAmount" INTEGER,
    "oldReason" TEXT,
    "newReason" TEXT,
    "changeNote" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "operatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MilkRecordHistory_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MilkRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" INTEGER NOT NULL,
    "reviewNote" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MilkRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TherapyFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "therapist" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TherapyFeedback_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MilkRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TherapyFeedback_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuspiciousRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" INTEGER,
    "childId" INTEGER NOT NULL,
    "childName" TEXT NOT NULL,
    "recordDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "parentMessage" TEXT,
    "paperNote" TEXT,
    "suspiciousReason" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "handledNote" TEXT,
    "handledBy" TEXT,
    "handledAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "TherapyFeedback_recordId_key" ON "TherapyFeedback"("recordId");
