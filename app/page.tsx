import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { ROUTES } from "@/lib/utils/constants";
import { HeroPage } from "@/components/hero/HeroPage";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      if (payload) {
        redirect(ROUTES.DASHBOARD);
      }
    } catch (error) {
      console.warn("Token validation failed on root page:", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return <HeroPage />;
}
