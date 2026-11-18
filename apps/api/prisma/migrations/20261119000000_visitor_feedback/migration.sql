CREATE TABLE "VisitorCounter" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VisitorCounter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitorFeedback" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitorFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VisitorFeedback_approved_createdAt_idx" ON "VisitorFeedback"("approved", "createdAt");
