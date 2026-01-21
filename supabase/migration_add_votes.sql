-- Add vote_score to wishlist_items
ALTER TABLE public.wishlist_items 
ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0;

-- Create item_votes table
CREATE TABLE IF NOT EXISTS public.item_votes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
    vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id)
);

-- Enable RLS on item_votes
ALTER TABLE public.item_votes ENABLE ROW LEVEL SECURITY;

-- Policies for item_votes
CREATE POLICY "Users can view all votes" 
ON public.item_votes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own votes" 
ON public.item_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.item_votes FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.item_votes FOR DELETE 
USING (auth.uid() = user_id);

-- Function to calculate and update vote_score
CREATE OR REPLACE FUNCTION public.update_vote_score()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.wishlist_items
        SET vote_score = (
            SELECT COALESCE(SUM(vote_value), 0)
            FROM public.item_votes
            WHERE item_id = OLD.item_id
        )
        WHERE id = OLD.item_id;
        RETURN OLD;
    ELSE
        UPDATE public.wishlist_items
        SET vote_score = (
            SELECT COALESCE(SUM(vote_value), 0)
            FROM public.item_votes
            WHERE item_id = NEW.item_id
        )
        WHERE id = NEW.item_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_vote_change ON public.item_votes;
CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.item_votes
FOR EACH ROW EXECUTE FUNCTION public.update_vote_score();
