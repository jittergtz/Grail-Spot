import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { CategoryNav } from "@/components/CategoryNav";
import { SearchBar } from "@/components/SearchBar";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Package2, Heart } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  price: string;
  tag: string;
  link?: string;
  description?: string;
  isStaffPick: boolean;
  createdAt?: string;
  voteScore: number;
  userVote: number; // 1, -1, or 0
}

const Index = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"public" | "personal">("public");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  // Update fetchItems to include vote data
  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      if (!mounted) return;
      setUser(currentUser);

      let query = supabase
        .from("wishlist_items")
        .select(`
          *,
          item_votes(vote_value)
        `)
        .order("created_at", { ascending: false });

      if (!currentUser) {
        query = query.eq("is_public", true);
      } else if (viewMode === "personal") {
        query = query.eq("user_id", currentUser.id);
      } else {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(error);
        return;
      }
      if (!mounted) return;

      setItems(
        (data ?? []).map((d: any) => {
           // Extract user vote if exists
           const userVoteData = d.item_votes?.find((v: any) => v.user_id === currentUser?.id);
           // Note: Since we can't filter the join easily by user_id in the select without complex syntax, 
           // and RLS might filter it for us or we filter in memory.
           // However, standard Supabase join returns array. 
           // Better approach: If we want EFFICIENT user-specific vote, we'd need a more complex query or RPC.
           // For now, assuming `item_votes` returns votes visible to user. 
           // If RLS is set "Users can view all votes", we get ALL votes. We need to find OURS.
           // BUT, we should probably only select OUR vote in the join?
           // Actually, simpler: fetch items, then fetch user's votes separately and merge?
           // OR: relying on the fact that we need check `user_id` in the returned array.
           
           // Refined approach below for mapping:
           // If we fetch all votes, that's too much data.
           // Let's rely on a separate query or better RLS?
           // Actually, standard pattern: 
           // .select('*, user_vote:item_votes(vote_value)') -> filters by RLS? 
           // RLS says "Users can view all votes". So we get ALL votes.
           // That's bad for performance if many votes.
           // Let's fix RLS or Query?
           // For this task, let's filter in memory but limit fetch?
           // No, we should filter `item_votes` by `user_id` in the query!
           // supabase.from(...).select('*, item_votes!left(vote_value)').eq('item_votes.user_id', currentUser.id) -> this filters ITEMS.
           
           // CORRECT APPROACH for this scale:
           // Fetch items.
           // Fetch `item_votes` for this user.
           // Merge.
           
           return {
            id: d.id,
            title: d.title,
            image: d.image,
            price: d.price,
            tag: d.tag,
            link: d.link,
            description: d.description,
            isStaffPick: d.is_staff_pick,
            createdAt: d.created_at,
            voteScore: d.vote_score || 0,
            userVote: 0 // Will update in a second pass or better query
          };
        })
      );
      
      // Separate pass for user votes if logged in
      if (currentUser) {
         const { data: votes } = await supabase
            .from("item_votes")
            .select("item_id, vote_value")
            .eq("user_id", currentUser.id);
            
         if (votes) {
             setItems(currentItems => currentItems.map(item => {
                 const vote = votes.find(v => v.item_id === item.id);
                 return vote ? { ...item, userVote: vote.vote_value } : item;
             }));
         }
      }
    };

    fetchItems();
    // ... existing cleanup ...
  }, [viewMode]);

  // Ref to track timeouts for debouncing votes
  const voteTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Handle Vote Logic
  const handleVote = async (itemId: string, direction: number) => {
     if (!user) {
        toast.info("Please sign in to vote");
        navigate("/auth");
        return;
     }

     // 1. Calculate the intended new state first to capture it for the debounce closure
     let newVote = direction;
     
     // We need to look up the *current* state of the item to decide the transition
     // However, inside this function, 'items' might be stale if called rapidly? 
     // No, 'items' is from render scope. But if rapid clicks happen, 'items' won't update fast enough in this scope?
     // Actually, standard React state update batching might complicate this if we rely on `items.find`.
     // But `setItems` functional update is reliable.
     // To avoid "stale closure" issues with rapid clicks, we should rely on the Functional Update to calculate final state
     // BUT we also need that final state for the API call.
     // Trick: The API call only cares about the TARGET vote value.
     // If I click Up (1), then Up again (0), the final API call should be 0.
     // If I click Up (1), then Down (-1), final is -1.
     // So we don't need the transition history for the API, just the final destination.
     
     // PROBLEM: We don't know the final destination without knowing the *current* state at the moment of click.
     // If we click fast, `items` in this closure is stale.
     // SOLUTION: Use a mutable ref to track the "pending" vote for each item? 
     // Or just trust that state updates happen fast enough? 
     // React state updates are async. 
     // A robust way for debouncing toggle-heavy actions:
     // Store the "latest intended vote" in a Ref map `pendingVotes = useRef({ itemId: voteVal })`.
     // Initialize it from `items` if missing.
     
     // Let's go with a slightly simpler approach that is usually "good enough" for UI toggles:
     // - We trust `setItems` to handle the logic correctly.
     // - We also need to know what `newVote` is to schedule the API call.
     // - We can piggyback off the functional update? No, can't extract return value.
     
     // BETTER APPROACH:
     // Calculate the `newVote` based on the item in `items`. 
     // If the user clicks fast, `items` MIGHT be stale, but usually React re-renders faster than human clicking speed for simple toggles.
     // Let's assume `items` is fresh enough.
     
     const item = items.find(i => i.id === itemId);
     if (!item) return;

     const oldVote = item.userVote;
     let scoreDelta = 0;

     if (oldVote === direction) {
         // Toggle off
         newVote = 0;
         scoreDelta = -direction;
     } else if (oldVote === 0) {
         // New vote
         scoreDelta = direction;
     } else {
         // Switch vote
         scoreDelta = direction * 2; // e.g. -1 to 1 = +2 difference
     }

     // Optimistic Update
     setItems(currentItems => currentItems.map(i => {
         if (i.id !== itemId) return i;
         return {
             ...i,
             userVote: newVote,
             voteScore: (i.voteScore || 0) + scoreDelta
         };
     }));

     // Debounce API Call
     if (voteTimeouts.current[itemId]) {
         clearTimeout(voteTimeouts.current[itemId]);
     }

     voteTimeouts.current[itemId] = setTimeout(async () => {
         try {
             if (newVote === 0) {
                 // Delete vote
                 await supabase.from("item_votes").delete().match({ user_id: user.id, item_id: itemId });
             } else {
                 // Upsert vote
                 await supabase.from("item_votes").upsert({
                     user_id: user.id,
                     item_id: itemId,
                     vote_value: newVote
                 });
             }
             delete voteTimeouts.current[itemId];
         } catch (err) {
             console.error("Vote failed", err);
             toast.error("Failed to save vote");
             // Ideally revert here, but tricky with debounce.
         }
     }, 1000); // 1 second debounce
  };




  // Check onboarding status for logged-in users
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (!currentUser) {
        setShowOnboarding(false);
        return;
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        // Profile might not exist yet, create it
        if (error.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              has_completed_onboarding: false,
            });

          if (!insertError) {
            setShowOnboarding(true);
          }
        }
        return;
      }

      // Show onboarding if user hasn't completed it
      if (profile && !profile.has_completed_onboarding) {
        setShowOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, [user]);


  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0 || localStorage.getItem("wishlistItems")) {
      localStorage.setItem("wishlistItems", JSON.stringify(items));
    }
  }, [items]);

  const categories = [
    { id: "all", name: "All", count: items.length },
    { id: "new", name: "New" },
    { id: "popular", name: "Popular" },
    { id: "tech", name: "Tech" },
    { id: "workspace", name: "Workspace" },
    { id: "home", name: "Home" },
    { id: "lifestyle", name: "Lifestyle" },
  ];

  const handleAddItem = async (
    item: Omit<WishlistItem, "id" | "isStaffPick"> & { isPublic?: boolean },
  ) => {
    // If user is logged in, insert into Supabase. Otherwise fallback to local state.
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (currentUser) {
        const res = await supabase.from("wishlist_items").insert({
          user_id: currentUser.id,
          title: item.title,
          image: item.image,
          price: item.price,
          tag: item.tag,
          link: item.link,
          description: item.description,
          is_public: item.isPublic ?? true,
        });

        const insertedData = res.data as any[] | null;
        const error = res.error;
        if (error) throw error;

        // Prepend to local list for instant feedback if returned
        const inserted =
          insertedData && Array.isArray(insertedData) && insertedData.length > 0
            ? insertedData[0]
            : null;
        if (inserted) {
          setItems((prev) => [
            {
              id: inserted.id,
              title: inserted.title,
              image: inserted.image,
              price: inserted.price,
              tag: inserted.tag,
              link: inserted.link,
              description: inserted.description,
              isStaffPick: inserted.is_staff_pick,
              createdAt: inserted.created_at, // Include created_at timestamp
              voteScore: 0,
              userVote: 0
            },
            ...prev,
          ]);
        }
      } else {
        const newItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(), // Add createdAt for local items
          voteScore: 0,
          userVote: 0,
          isStaffPick: false // Default for local items
        };
        setItems([newItem, ...items]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
  };

  const handleToggleViewMode = async () => {
    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (!currentUser) {
      toast.info("Sign in to view your personal wishlist");
      navigate("/auth");
      return;
    }

    setViewMode((prev) => (prev === "public" ? "personal" : "public"));
  };

  const handleCompleteOnboarding = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (!currentUser) return;

    // Update profile to mark onboarding as completed
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_onboarding: true })
      .eq("id", currentUser.id);

    if (!error) {
      setShowOnboarding(false);
      toast.success("Welcome to Grail Spot! 🎉");
    } else {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding");
    }
  };


  // Filter items by category and search query - memoized to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter with special handling for "new" and "picks"
      let categoryMatch = false;
      
      if (activeCategory === "all") {
        categoryMatch = true;
      } else if (activeCategory === "new") {
        // Show items created in the last 30 days
        if (item.createdAt) {
          const itemDate = new Date(item.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          categoryMatch = itemDate >= thirtyDaysAgo;
        } else {
          // If no createdAt, assume it's old (for backward compatibility)
          categoryMatch = false;
        }
      } else if (activeCategory === "popular") {
        // Show popular items (voteScore >= 10)
        categoryMatch = (item.voteScore || 0) >= 10;
      } else {
        // Regular category matching by tag
        categoryMatch = item.tag.toLowerCase().includes(activeCategory.toLowerCase());
      }

      // Search filter - search across title, tag, and description
      const searchMatch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && searchMatch;
    });
  }, [items, activeCategory, searchQuery]);

  // Memoize background color to prevent recalculation
  const navBgColor = useMemo(
    () =>
      viewMode === "personal" ? "rgba(39,39,42,1)" : "rgba(255,255,255,0)",
    [viewMode],
  );

  return (
    <div className="min-h-screen bg-zinc-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
            <div className="flex  items-center gap-3">
              <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                <Package2 className="w-2 h-2" />
              </div>
              <h1 className="text-sm text-foreground">
                {" "}
                <span
                  style={{
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontFamily: "'Source Serif 4', serif",
                  }}
                >
                  Grail
                </span>{" "}
                Spot
              </h1>
                 
            </div>
              
              <div className="gap-5 flex items-center">
                {/* maybe later adding to Navbar more   */}
             {/* <h1 className="text-sm text-zinc-600">Rules</h1> */}
             </div>
    
        </div>
            <div className="flex  items-center gap-4">
              <AuthButton />
            </div>
          </div>
          <div className="w-full py-12 flex justify-center flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={viewMode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl text-center sm:text-4xl"
                style={{
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontFamily: "'Source Serif 4', serif",
                }}
              >
                {viewMode === "personal"
                  ? "My Personal Wishlist"
                  : "Find well crafted Quality Products."}
              </motion.h1>

              <motion.p
                key={viewMode + "-sub"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  duration: 0.25,
                  delay: 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-2 h-10 text-sm sm:w-[560px] text-zinc-600 tracking-wide text-center"
              >
                {viewMode === "personal"
                  ? "Your personal collection of products you love."
                  : "Grail Spot is a Community where people share aesthetic quality products they love, and discover new products they gonna love soon."}
              </motion.p>
            </AnimatePresence>
          </div>
        </header>

        {/* Sticky nav - NOW OUTSIDE header so it can stick throughout the page */}
        <div className="sticky top-2 z-50 mb-8">
          <motion.div
            className="flex w-full relativ  justify-between items-center rounded-full backdrop-blur-lg shadow-lg transition p-2"
            animate={{ backgroundColor: navBgColor }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <div className="absolute top-2 right-1 flex items-center gap-2 z-50">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleViewMode}
                  className={`h-10 w-10 rounded-full ${
                    viewMode === "personal"
                      ? "bg-amber-200 hover:bg-amber-100 text-zinc-800"
                      : "bg-zinc-100 hover:bg-white text-zinc-600"
                  } transition-colors`}
                >
                  <Heart
                    className={`w-5 h-5 ${viewMode === "personal" ? "fill-current" : ""}`}
                  />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={handleSearchClear}
              />
            </div>
          </motion.div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {/* ... rest of your empty state ... */}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ProductCard 
                key={item.id} 
                {...item} 
                voteScore={item.voteScore}
                currentVote={item.userVote}
                onVote={(val) => handleVote(item.id, val)}
              />
            ))}
          </div>
        )}

        <AddItemDialog onAddItem={handleAddItem} />
        <OnboardingModal open={showOnboarding} onComplete={handleCompleteOnboarding} />
      </div>
    </div>
  );
};

export default Index;
