import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href={ROUTES.HOME}
        className="mt-6 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}
