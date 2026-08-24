import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface py-6 mt-auto">
      <div className="container max-w-[--spacing-container-max] mx-auto px-md lg:px-lg flex flex-col md:flex-row justify-between items-center gap-4 text-body-sm text-on-surface-variant">
        <p>© {new Date().getFullYear()} UniShare. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
