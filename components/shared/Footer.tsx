import Link from "next/link";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface py-6 mt-auto">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-body-sm text-on-surface-variant md:flex-row lg:px-6">
        <p>© {CURRENT_YEAR} UniShare. All rights reserved.</p>
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
