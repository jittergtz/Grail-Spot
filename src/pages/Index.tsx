import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { CategoryNav } from "@/components/CategoryNav";
import { SearchBar } from "@/components/SearchBar";
import { Package2 } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { supabase } from "@/lib/supabase";

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
        query.eq("is_public", true);
      } else {
        query.or(`is_public.eq.true,user_id.eq.${currentUser.id}`);
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
  }, []);

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

  // Filter items by category and search query
  const filteredItems = items.filter((item) => {
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

  return (
    <div className="min-h-screen bg-zinc-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                <Package2 className="w-2 h-2" />
              </div>
              <h1 className="text-sm font-semibold text-foreground">Grail Spot</h1>
            </div>

            <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={handleSearchClear}
          />

            <div className="flex items-center gap-4">
              <AuthButton />
            </div>
          </div>

          <div className="w-full  py-12 flex justify-center flex-col items-center">
            <h1 className=" text-2xl text-center sm:text-4xl" style={{ fontStyle: "italic", fontWeight : 500, fontFamily: "'Source Serif 4', serif" }}>Find well crafted Quality Products.</h1>
            <p className="mt-2 text-sm sm:w-[560px] text-zinc-600 tracking-wide text-center">
              Grail Spot is a Community where people share aesthetic quality products they love, and discover new products they gonna love soon.</p>
          </div>

          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </header>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted rounded-full p-8 mb-6">
              <Package2 className="w-16 h-16 text-muted-foreground" />
            </div>
            {searchQuery || activeCategory !== "all" ? (
              <>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  No items found
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Start building your collection by adding items you want to buy. Click the + button
                  to get started.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-3  gap-6">
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
