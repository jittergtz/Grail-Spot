import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface EditItemDialogProps {
  item: WishlistItem;
  onEdit: (item: Omit<WishlistItem, "id">) => void;
}

export const EditItemDialog = ({ item, onEdit }: EditItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: item.title,
    image: item.image,
    price: item.price,
    tag: item.tag,
    link: item.link || "",
    description: item.description || "",
    isStaffPick: item.isStaffPick,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image || !formData.price || !formData.tag) {
      toast.error("Please fill in all required fields");
      return;
    }

    onEdit({
      title: formData.title,
      image: formData.image,
      price: formData.price,
      tag: formData.tag,
      link: formData.link || undefined,
      description: formData.description || undefined,
      isStaffPick: formData.isStaffPick,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of your wishlist item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Studio Display"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-image">
              Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="$1,599"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tag">
                Tag/Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-tag"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="Tech"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-link">Link (Optional)</Label>
            <Input
              id="edit-link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com/product"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-staffPick"
              checked={formData.isStaffPick}
              onChange={(e) => setFormData({ ...formData, isStaffPick: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="edit-staffPick" className="cursor-pointer">
              Mark as Staff Pick
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
