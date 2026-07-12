-- Use pending as the default branch onboarding state after enum value commit.
ALTER TABLE "Branch" ALTER COLUMN "status" SET DEFAULT 'pending';
