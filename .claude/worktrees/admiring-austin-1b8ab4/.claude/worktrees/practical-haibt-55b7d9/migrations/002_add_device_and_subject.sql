-- Migration 002: Add device_info and current_subject columns to profiles
ALTER TABLE profiles ADD COLUMN current_subject TEXT;
ALTER TABLE profiles ADD COLUMN device_info TEXT;
