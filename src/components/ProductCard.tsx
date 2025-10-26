import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  price: string;
  tag: string;
  link?: string;
  description?: string;
  isStaffPick?: boolean;
}

export const ProductCard = ({
  title,
  image,
  price,
  tag,
  link,
  description,
  isStaffPick,
}: ProductCardProps) => {
  return (
    <div className="group relative bg-card rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
          >
            <ExternalLink className="w-4 h-4 text-foreground" />
          </a>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        {isStaffPick && (
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Staff Pick
          </Badge>
        )}
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{tag}</p>
          <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          <p className="text-lg font-bold text-foreground pt-1">{price}</p>
        </div>
      </div>
    </div>
  );
};
