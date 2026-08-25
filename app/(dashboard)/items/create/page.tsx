"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useCreateItem } from "@/lib/hooks/useItems";
import { ITEM_CATEGORIES } from "@/lib/utils/constants";
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
import { toast } from "sonner";

const createItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  pricePerDay: z.string().min(1, "Price is required"),
  deposit: z.string().optional(),
  imageUrl: z.string().url("Invalid URL").optional(),
});

type CreateItemFormData = z.infer<typeof createItemSchema>;

export default function CreateItemPage() {
  const router = useRouter();
  const createItem = useCreateItem();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      pricePerDay: "",
      deposit: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: CreateItemFormData) => {
    try {
      await createItem.mutateAsync({
        name: data.name,
        description: data.description,
        category: data.category,
        pricePerDay: parseFloat(data.pricePerDay),
        deposit: data.deposit ? parseFloat(data.deposit) : 0,
        imageUrl: data.imageUrl,
      });
      toast.success("🎉 Item listed successfully!");
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      toast.error("Failed to list item. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-h2 font-h2 text-on-surface">List a New Item</h1>
        <p className="text-body-sm text-on-surface-variant">
          Share your gear with the campus community and start earning.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
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

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the item's condition, included accessories..."
            className="resize-y min-h-[100px]"
            {...register("description")}
          />
        </div>

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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Listing...
            </>
          ) : (
            "List Item"
          )}
        </Button>
      </form>
    </div>
  );
}
