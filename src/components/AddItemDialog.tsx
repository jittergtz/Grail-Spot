import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddItemDialogProps {
  onAddItem: (item: {
    title: string;
    image: string;
    price: string;
    tag: string;
    link?: string;
    description?: string;
    isStaffPick: boolean;
    isPublic?: boolean;
  }) => Promise<void> | void;
}

export const AddItemDialog = ({ onAddItem }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    price: "",
    tag: "",
    link: "",
    description: "",
    isStaffPick: false,
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image || !formData.price || !formData.tag) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onAddItem({
        title: formData.title,
        image: formData.image,
        price: formData.price,
        tag: formData.tag,
        link: formData.link || undefined,
        description: formData.description || undefined,
        isStaffPick: formData.isStaffPick,
        isPublic: formData.isPublic,
      });

      setFormData({
        title: "",
        image: "",
        price: "",
        tag: "",
        link: "",
        description: "",
        isStaffPick: false,
        isPublic: true,
      });

      setOpen(false);
      toast.success("Item added to your wishlist!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item. Please try again.");
    }
  };

  const navigate = useNavigate();

  const handleOpenClick = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      if (!currentUser) {
        // Require sign-in to add persistent items
        toast.error("Please sign in to add items");
        navigate("/auth");
        return;
      }
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Unable to open add dialog");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="lg"
        onClick={handleOpenClick}
        className="fixed bottom-8 right-8 rounded-full shadow-lg h-14 w-14 p-0 hover:scale-110 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your wishlist. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Studio Display"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="$1,599"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">
                Tag/Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tag"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="Tech"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (Optional)</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com/product"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="staffPick"
              checked={formData.isStaffPick}
              onChange={(e) => setFormData({ ...formData, isStaffPick: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="staffPick" className="cursor-pointer">
              Mark as Staff Pick
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Make Public (visible to everyone)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
