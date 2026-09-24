export function getRentalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
    CONFIRMED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    ACTIVE: "bg-green-500/15 text-green-600 border-green-500/20",
    RETURNED: "bg-gray-500/15 text-gray-600 border-gray-500/20",
    OVERDUE: "bg-red-500/15 text-red-600 border-red-500/20",
    CANCELLED: "bg-red-500/15 text-red-600 border-red-500/20",
  };
  return colors[status] || "bg-gray-500/15 text-gray-600 border-gray-500/20";
}

export function getItemStatusColor(status: string): string {
  return status === "AVAILABLE"
    ? "bg-green-500/15 text-green-600 border-green-500/20"
    : "bg-gray-500/15 text-gray-600 border-gray-500/20";
}
