import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { CategoryNav } from "@/components/CategoryNav";
import { SearchBar } from "@/components/SearchBar";
import { Package2 } from "lucide-react";

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

  // Load items from localStorage on mount
  useEffect(() => {
    const storedItems = localStorage.getItem("wishlistItems");
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
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

  const handleAddItem = (
    item: Omit<WishlistItem, "id">
  ) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setItems([newItem, ...items]);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Package2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
            </div>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={handleSearchClear}
          />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
