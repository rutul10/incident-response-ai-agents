-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "alertPayload" JSONB NOT NULL,
    "severity" TEXT,
    "service" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTask" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dependsOn" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedAgent" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentResult" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postmortem" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "affectedService" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "rootCause" TEXT NOT NULL,
    "blastRadius" JSONB NOT NULL,
    "remediationSteps" JSONB NOT NULL,
    "lessonsLearned" TEXT NOT NULL,
    "actionItems" JSONB NOT NULL,
    "draft" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postmortem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentResult_taskId_key" ON "AgentResult"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Postmortem_incidentId_key" ON "Postmortem"("incidentId");

-- AddForeignKey
ALTER TABLE "IncidentTask" ADD CONSTRAINT "IncidentTask_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentResult" ADD CONSTRAINT "AgentResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "IncidentTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postmortem" ADD CONSTRAINT "Postmortem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
