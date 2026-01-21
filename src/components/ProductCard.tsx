import { BadgeCheck, ExternalLink, Star, ArrowBigUp, ArrowBigDown, Flame } from "lucide-react";
import { Link } from "react-router-dom";
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
  voteScore?: number;
  currentVote?: number; // 1 for up, -1 for down, 0 or undefined for none
  onVote?: (value: number) => void;
}

export const ProductCard = ({
  id,
  title,
  image,
  price,
  tag,
  link,
  description,
  isStaffPick,
  voteScore = 0,
  currentVote = 0,
  onVote,
}: ProductCardProps) => {
  return (
    <Link to={`/item/${id}`} className="block">
      <div className="group w-full h-[420px]    relative bg-card rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer">
        <div className="relative flex p-4 justify-center  bg-white overflow-hidden">
          <img
            src={image}
            alt={title}
            className="  max-h-64 rounded-3xl object-cover bg transition-transform duration-300 group-hover:scale-105"
          />
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background z-10"
            >
              <ExternalLink className="w-4 h-4 text-foreground" />
            </a>
          )}
        </div>
        
        <div className="p-3   space-y-2">
          {voteScore >= 10 && (
            <Badge variant="secondary" className="gap-1 absolute bottom-20 right-5">
             <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              Popular
            </Badge>
          )}
          
          <div className="space-y-  w-full absolute bottom-3 left-5 ">
            <p className="text-xs text-zinc-400 ">{tag}</p>
            <h3 className="text-zinc-600  text-lg  text-foreground line-clamp-2">{title}</h3>
           
           <div className="flex items-center  justify-between w-full mt-2  pr-8">
             <p className="text-lg text-zinc-400  text-foreground ">$ {price}</p>
            
            {/* Voting UI */}
            <div className="flex items-center gap-1 bg-zinc-50 rounded-full px-2 py-1" onClick={(e) => e.preventDefault()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onVote && onVote(1);
                }}
                className={`p-1 rounded-full hover:bg-zinc-200 transition-colors ${
                  currentVote === 1 ? "text-indigo-500" : "text-zinc-500"
                }`}
              >
                <ArrowBigUp className={`w-5 h-5 ${currentVote === 1 ? "fill-current" : ""}`} />
              </button>
              
              <span className={`text-sm font-medium ${
                currentVote === 1 ? " text-indigo-500" : 
                currentVote === -1 ? "text-orange-500" : "text-zinc-600"
              }`}>
                {voteScore || 0}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onVote && onVote(-1);
                }}
                className={`p-1 rounded-full hover:bg-zinc-200 transition-colors ${
                  currentVote === -1 ? "text-orange-500" : "text-zinc-500"
                }`}
              >
                <ArrowBigDown className={`w-5 h-5 ${currentVote === -1 ? "fill-current" : ""}`} />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
