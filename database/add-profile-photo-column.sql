-- Add profile_photo column to spf_users table
-- This column stores the Cloudinary URL for the user's profile photo

ALTER TABLE spf_users
ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);

COMMENT ON COLUMN spf_users.profile_photo IS 'Cloudinary URL for user profile photo';
