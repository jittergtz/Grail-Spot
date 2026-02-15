-- Drop the existing foreign key constraint
ALTER TABLE public.comments
DROP CONSTRAINT comments_user_id_fkey;

-- Add the new foreign key constraint referencing public.profiles
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
