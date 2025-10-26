import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: Array<{ id: string; name: string; count?: number }>;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) => {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          {category.name}
          {category.count !== undefined && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                activeCategory === category.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}
            >
              {category.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
