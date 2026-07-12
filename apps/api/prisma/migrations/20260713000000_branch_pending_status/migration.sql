-- Add pending approval state for branch onboarding.
ALTER TYPE "BranchStatus" ADD VALUE IF NOT EXISTS 'pending';
