import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { toast } from "sonner";
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
  userId?: string;
}

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchItem = async () => {
      // First, check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      if (!mounted) return;
      setCurrentUserId(currentUser?.id ?? null);

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        // Fallback to localStorage if Supabase fails
        const storedItems = localStorage.getItem("wishlistItems");
        if (storedItems) {
          const items: WishlistItem[] = JSON.parse(storedItems);
          const foundItem = items.find((i) => i.id === id);
          if (foundItem && mounted) {
            setItem(foundItem);
            return;
          }
        }
        if (mounted) {
          toast.error("Item not found");
          navigate("/");
        }
        return;
      }

      if (data && mounted) {
        setItem({
          id: data.id,
          title: data.title,
          image: data.image,
          price: data.price,
          tag: data.tag,
          link: data.link,
          description: data.description,
          isStaffPick: data.is_staff_pick,
          userId: data.user_id,
        });
      }
    };

    fetchItem();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        // Fallback to localStorage if Supabase fails
        const storedItems = localStorage.getItem("wishlistItems");
        if (storedItems) {
          const items: WishlistItem[] = JSON.parse(storedItems);
          const updatedItems = items.filter((i) => i.id !== id);
          localStorage.setItem("wishlistItems", JSON.stringify(updatedItems));
        }
        toast.success("Item deleted from wishlist");
      } else {
        toast.success("Item deleted from wishlist");
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  const handleEdit = async (updatedItem: Omit<WishlistItem, "id">) => {
    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .update({
          title: updatedItem.title,
          image: updatedItem.image,
          price: updatedItem.price,
          tag: updatedItem.tag,
          link: updatedItem.link,
          description: updatedItem.description,
          is_staff_pick: updatedItem.isStaffPick,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(error);
        // Fallback to localStorage if Supabase fails
        const storedItems = localStorage.getItem("wishlistItems");
        if (storedItems && item) {
          const items: WishlistItem[] = JSON.parse(storedItems);
          const updatedItems = items.map((i) =>
            i.id === id ? { ...updatedItem, id: item.id } : i
          );
          localStorage.setItem("wishlistItems", JSON.stringify(updatedItems));
          setItem({ ...updatedItem, id: item.id });
          toast.success("Item updated successfully");
          return;
        }
        toast.error("Failed to update item");
        return;
      }

      if (data) {
        setItem({
          id: data.id,
          title: data.title,
          image: data.image,
          price: data.price,
          tag: data.tag,
          link: data.link,
          description: data.description,
          isStaffPick: data.is_staff_pick,
        });
        toast.success("Item updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update item");
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2 rounded-full border border-zinc-300">
              <ArrowLeft className="w-4 h-4" />
              Back to Wishlist
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl overflow-hidden shadow-lg">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <div className="aspect-square  border flex p-4 items-center justify-center bg-white rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-[400px]  object-cover"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {item.isStaffPick && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Staff Pick
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground font-medium">
                    {item.tag}
                  </p>
                  <h1 className="text-3xl font-bold text-foreground">
                    {item.title}
                  </h1>
                </div>
                {currentUserId && item.userId && currentUserId === item.userId && (
                  <div className="flex gap-2">
                    <EditItemDialog item={item} onEdit={handleEdit} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this item from your
                            wishlist? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-semibold text-zinc-500 text-foreground">
                   ${item.price}
                  </p>
                </div>

                {item.description && (
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-500 mb-2">
                      Description
                    </h2>
                    <p className="text-zinc-800 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                {item.link && (
                  <div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View Product
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
