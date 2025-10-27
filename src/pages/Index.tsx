import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { CategoryNav } from "@/components/CategoryNav";
import { SearchBar } from "@/components/SearchBar";
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
}

const Index = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'public' | 'personal'>('public');
  const navigate = useNavigate();

  // Load items from Supabase (public + owner if logged in) on mount
  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      if (!mounted) return;
      setUser(currentUser);

      const query = supabase
        .from("wishlist_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (!currentUser) {
        // Logged out users only see public items
        query.eq("is_public", true);
      } else if (viewMode === 'personal') {
        // Personal wishlist: show ALL user's items (both public and private)
        query.eq("user_id", currentUser.id);
      } else {
        // Public feed: show all public items from all users
        query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) {
        console.error(error);
        return;
      }
      if (!mounted) return;
      setItems(
        (data ?? []).map((d: any) => ({
          id: d.id,
          title: d.title,
          image: d.image,
          price: d.price,
          tag: d.tag,
          link: d.link,
          description: d.description,
          isStaffPick: d.is_staff_pick,
        }))
      );
    };

    fetchItems();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchItems();
    });

    return () => {
      mounted = false;
      try {
        if (listener && (listener as any).subscription && typeof (listener as any).subscription.unsubscribe === "function") {
          (listener as any).subscription.unsubscribe();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [viewMode]);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0 || localStorage.getItem("wishlistItems")) {
      localStorage.setItem("wishlistItems", JSON.stringify(items));
    }
  }, [items]);

  const categories = [
    { id: "all", name: "All", count: items.length },
    { id: "new", name: "New" },
    { id: "picks", name: "Picks" },
    { id: "tech", name: "Tech" },
    { id: "workspace", name: "Workspace" },
    { id: "home", name: "Home" },
    { id: "carry", name: "Carry" },
    { id: "lifestyle", name: "Lifestyle" },
  ];

  const handleAddItem = async (item: Omit<WishlistItem, "id"> & { isPublic?: boolean }) => {
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
          is_staff_pick: item.isStaffPick ?? false,
          is_public: item.isPublic ?? true,
        });

        const insertedData = res.data as any[] | null;
        const error = res.error;
        if (error) throw error;

        // Prepend to local list for instant feedback if returned
        const inserted = insertedData && Array.isArray(insertedData) && insertedData.length > 0 ? insertedData[0] : null;
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
            },
            ...prev,
          ]);
        }
      } else {
        const newItem = {
          ...item,
          id: Date.now().toString(),
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

    setViewMode(prev => prev === 'public' ? 'personal' : 'public');
  };

  // Filter items by category and search query - memoized to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      const categoryMatch =
        activeCategory === "all" ||
        item.tag.toLowerCase().includes(activeCategory.toLowerCase());

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
  const navBgColor = useMemo(() => 
    viewMode === 'personal' ? 'rgba(39,39,42,1)' : 'rgba(255,255,255,0)',
    [viewMode]
  );

  return (
<div className="min-h-screen bg-zinc-200">
  <div className="container mx-auto px-4 py-8 max-w-7xl">
    
    <header className="mb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1 rounded-lg">
            <Package2 className="w-2 h-2" />
          </div>
          <h1 className="text-sm text-foreground"> <span style={{ fontStyle: "italic", fontWeight: 500, fontFamily: "'Source Serif 4', serif" }}>Grail</span> Spot</h1>
        </div>
        <div className="flex items-center gap-4">
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
            style={{ fontStyle: "italic", fontWeight: 500, fontFamily: "'Source Serif 4', serif" }}
          >
            {viewMode === 'personal' ? 'My Personal Wishlist' : 'Find well crafted Quality Products.'}
          </motion.h1>

          <motion.p
            key={viewMode + "-sub"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 h-10 text-sm sm:w-[560px] text-zinc-600 tracking-wide text-center"
          >
            {viewMode === 'personal'
              ? 'Your personal collection of products you love.'
              : 'Grail Spot is a Community where people share aesthetic quality products they love, and discover new products they gonna love soon.'}
          </motion.p>
        </AnimatePresence>
      </div>
    </header>

    {/* Sticky nav - NOW OUTSIDE header so it can stick throughout the page */}
      <div className="sticky top-2 z-50 mb-8">
      <motion.div
        className="flex w-full relative justify-between items-center rounded-full backdrop-blur-lg shadow-lg transition p-2"
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
                viewMode === 'personal' 
                  ? 'bg-amber-200 text-zinc-800' 
                  : 'bg-white/80 hover:bg-white text-zinc-600'
              } transition-colors`}
            >
             
                <Heart
                  className={`w-5 h-5 ${viewMode === 'personal' ? 'fill-current' : ''}`}
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
          <ProductCard key={item.id} {...item} />
        ))}
      </div>
    )}
    
    <AddItemDialog onAddItem={handleAddItem} />
  </div>
</div>
  );
};

export default Index;