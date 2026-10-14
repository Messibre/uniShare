import { Navbar } from "@/components/shared/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 scroll-mt-24 outline-none">{children}</main>
    </div>
  );
}
