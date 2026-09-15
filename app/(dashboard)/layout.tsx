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
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-10 pb-32 lg:px-6 lg:pb-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
