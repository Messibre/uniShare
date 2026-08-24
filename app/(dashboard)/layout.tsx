import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-[--spacing-container-max] mx-auto px-md lg:px-lg py-xl pb-32 lg:pb-xl">
        {children}
      </main>
      <Footer />
    </div>
  );
}
