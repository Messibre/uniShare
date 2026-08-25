"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useItem, useUpdateItem } from "@/lib/hooks/useItems";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "@/lib/utils/constants";
import { ROUTES } from "@/lib/utils/constants";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const editItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  pricePerDay: z.string().min(1, "Price is required"),
  deposit: z.string().optional(),
  imageUrl: z.string().url("Invalid URL").optional(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "REMOVED"]),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

export default function EditItemPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const updateItem = useUpdateItem();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      pricePerDay: "",
      deposit: "",
      imageUrl: "",
      status: "AVAILABLE",
    },
  });

  // Populate form when item loads
  useEffect(() => {
    if (item) {
      setValue("name", item.name);
      setValue("description", item.description || "");
      setValue("category", item.category);
      setValue("pricePerDay", String(item.pricePerDay));
      setValue("deposit", item.deposit ? String(item.deposit) : "");
      setValue("imageUrl", item.imageUrl || "");
      setValue("status", item.status);
    }
  }, [item, setValue]);

  const onSubmit = async (data: EditItemFormData) => {
    setIsSubmitting(true);
    try {
      await updateItem.mutateAsync({
        id,
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          pricePerDay: parseFloat(data.pricePerDay),
          deposit: data.deposit ? parseFloat(data.deposit) : 0,
          imageUrl: data.imageUrl,
          status: data.status,
        },
      });
      toast.success("Item updated successfully!");
      router.push(`/items/${id}`);
    } catch (error) {
      toast.error("Failed to update item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h2 font-h2 text-on-surface">Item not found</h2>
        <p className="text-body-md text-on-surface-variant">
          The item you're trying to edit doesn't exist.
        </p>
        <Link
          href={ROUTES.ITEMS}
          className="text-primary hover:underline mt-4 inline-block"
        >
          ← Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-h2 font-h2 text-on-surface">Edit Item</h1>
        <p className="text-body-sm text-on-surface-variant">
          Update your listing details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            placeholder="e.g., Sony A7III Camera"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-label-sm text-error">{errors.name.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-label-sm text-error">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ITEM_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p className="text-label-sm text-error">{errors.status.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the item's condition, included accessories..."
            className="resize-y min-h-[100px]"
            {...register("description")}
          />
        </div>

        {/* Price & Deposit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pricePerDay">Price per Day ($)</Label>
            <Input
              id="pricePerDay"
              type="number"
              step="0.50"
              placeholder="15.00"
              {...register("pricePerDay")}
            />
            {errors.pricePerDay && (
              <p className="text-label-sm text-error">
                {errors.pricePerDay.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit">Deposit ($)</Label>
            <Input
              id="deposit"
              type="number"
              step="5"
              placeholder="50.00"
              {...register("deposit")}
            />
          </div>
        </div>

        {/* Image URL */}
        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            placeholder="https://example.com/image.jpg"
            {...register("imageUrl")}
          />
          {errors.imageUrl && (
            <p className="text-label-sm text-error">
              {errors.imageUrl.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-outline text-on-surface hover:bg-surface-container"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
