-- Migration: Add onboarding tracking to profiles table
-- Run this in your Supabase SQL Editor

-- Add has_completed_onboarding column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Update existing users to have completed onboarding (so they don't see it)
-- Remove this line if you want existing users to see the onboarding too
UPDATE public.profiles 
SET has_completed_onboarding = true 
WHERE has_completed_onboarding IS NULL;
