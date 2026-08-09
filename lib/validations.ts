import { z } from "zod";

// Password regex: at least 8 characters, at least one letter and one number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Registration schema
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Invalid email address"),
  password: passwordSchema,
});

// Login schema
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
// Item schemas
export const createItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  pricePerDay: z.number().positive("Price must be greater than 0"),
  deposit: z.number().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  pricePerDay: z.number().positive().optional(),
  deposit: z.number().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "REMOVED"]).optional(),
});

// Rental schemas
export const createRentalSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
});

export const updateRentalStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "ACTIVE", "RETURNED", "CANCELLED"]),
  note: z.string().optional(),
});

// Types inferred from the schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>;
