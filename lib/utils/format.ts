export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateRange(
  start: string | Date,
  end: string | Date,
): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;

  if (s.getFullYear() === e.getFullYear()) {
    return `${formatDate(s)} – ${formatDate(e)}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(0)} ETB`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return `${count} ${count === 1 ? singular : plural || singular + "s"}`;
}

export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
