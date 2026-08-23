export const ITEM_CATEGORIES = [
  "Electronics",
  "Academic",
  "Sports",
  "Furniture",
  "Event Gear",
  "Clothing",
  "Other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const RENTAL_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  ACTIVE: "ACTIVE",
  RETURNED: "RETURNED",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type RentalStatus =
  (typeof RENTAL_STATUSES)[keyof typeof RENTAL_STATUSES];

export const ITEM_STATUSES = {
  AVAILABLE: "AVAILABLE",
  RENTED: "RENTED",
  MAINTENANCE: "MAINTENANCE",
  REMOVED: "REMOVED",
} as const;

export type ItemStatus = (typeof ITEM_STATUSES)[keyof typeof ITEM_STATUSES];

export const STATUS_COLORS: Record<string, string> = {
  // Rental Statuses
  PENDING: "bg-yellow-500 text-white",
  CONFIRMED: "bg-blue-500 text-white",
  ACTIVE: "bg-green-500 text-white",
  RETURNED: "bg-gray-500 text-white",
  OVERDUE: "bg-red-500 text-white",
  CANCELLED: "bg-red-500 text-white",
  // Item Statuses
  AVAILABLE: "bg-green-500 text-white",
  RENTED: "bg-blue-500 text-white",
  MAINTENANCE: "bg-orange-500 text-white",
  REMOVED: "bg-gray-500 text-white",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  ITEMS: "/items",
  ITEM_DETAIL: (id: string) => `/items/${id}`,
  CREATE_ITEM: "/items/create",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
