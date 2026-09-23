"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { useCreatePlatformItem } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ITEM_CATEGORIES } from "@/lib/utils/constants";

const EMPTY = {
  name: "",
  description: "",
  category: "",
  pricePerDay: "",
  deposit: "",
  imageUrl: "",
};

export function PlatformItemForm() {
  const [form, setForm] = useState(EMPTY);
  const createPlatformItem = useCreatePlatformItem();

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      toast.error("Please choose a category");
      return;
    }
    try {
      await createPlatformItem.mutateAsync({
        name: form.name,
        description: form.description,
        category: form.category,
        pricePerDay: parseFloat(form.pricePerDay),
        deposit: form.deposit ? parseFloat(form.deposit) : 0,
        imageUrl: form.imageUrl,
      });
      toast.success("Platform item created");
      setForm(EMPTY);
    } catch {
      toast.error("Failed to create platform item");
    }
  };

  return (
    <div className="max-w-2xl rounded-2xl border border-outline-variant bg-surface p-6 shadow-[var(--shadow-level-1)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-h3 font-semibold text-on-surface">
            Create platform item
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Platform-owned gear (calculators, cameras, lab kits) available for
            every verified student to rent.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="platform-name">Item name</Label>
          <Input
            id="platform-name"
            placeholder="e.g. Canon EOS 2000D Camera"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="platform-category">Category</Label>
          <Select
            value={form.category || undefined}
            onValueChange={(value) => set("category", value ?? "")}
          >
            <SelectTrigger id="platform-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="platform-description">Description</Label>
          <Textarea
            id="platform-description"
            placeholder="Condition, included accessories, notes…"
            className="min-h-[80px] resize-y"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="platform-price">Price per day ($)</Label>
            <Input
              id="platform-price"
              type="number"
              step="0.50"
              min="0"
              placeholder="250"
              value={form.pricePerDay}
              onChange={(e) => set("pricePerDay", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platform-deposit">Deposit ($)</Label>
            <Input
              id="platform-deposit"
              type="number"
              step="5"
              min="0"
              placeholder="1000"
              value={form.deposit}
              onChange={(e) => set("deposit", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="platform-image">Image URL</Label>
          <Input
            id="platform-image"
            placeholder="https://example.com/image.jpg"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={createPlatformItem.isPending}
          className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
        >
          {createPlatformItem.isPending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating…
            </>
          ) : (
            "Create platform item"
          )}
        </Button>
      </form>
    </div>
  );
}
