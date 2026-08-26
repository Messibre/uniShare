"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  User,
  Plus,
  LogOut,
  Settings,
  LayoutDashboard,
  Home,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLogout } from "@/lib/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROUTES } from "@/lib/utils/constants";
import { getInitials } from "@/lib/utils/format";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  const navLinks = [
    { href: ROUTES.ITEMS, label: "Browse", icon: Home, public: true },
    {
      href: ROUTES.DASHBOARD,
      label: "Dashboard",
      icon: LayoutDashboard,
      public: false, // Only shown when authenticated
    },
  ];

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-outline-variant shadow-[--shadow-level-1] dark:shadow-none">
      <div className="container max-w-[--spacing-container-max] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="text-h3 font-bold text-primary hover:no-underline"
        >
          UniShare
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(({ href, label, icon: Icon, public: isPublic }) => {
            if (!isPublic && !isAuthenticated) return null;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-label-md font-medium transition-colors hover:text-primary ${
                  isActive(href)
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          {/* Admin link – only for admins */}
          {isAuthenticated && user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 text-label-md font-medium transition-colors hover:text-primary ${
                isActive("/admin")
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    <Avatar className="h-9 w-9 border-2 border-primary-container/20">
                      <AvatarFallback className="bg-primary-container/10 text-primary-container font-semibold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium leading-none text-on-surface">
                    {user.fullName}
                  </p>
                  <p className="text-xs leading-none text-on-surface-variant mt-1">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link
                      href={ROUTES.PROFILE}
                      className="flex w-full items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link
                      href={ROUTES.SETTINGS}
                      className="flex w-full items-center gap-2 cursor-pointer"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  }
                />
                {user.role === "ADMIN" && (
                  <DropdownMenuItem
                    render={
                      <Link
                        href="/admin"
                        className="flex w-full items-center gap-2 cursor-pointer"
                      >
                        <Shield className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    }
                  />
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 text-error cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={ROUTES.LOGIN}
              className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-4 py-2 rounded-md text-label-md font-medium transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-72 bg-surface border-l border-outline-variant"
        >
          <SheetHeader className="border-b border-outline-variant pb-4 mb-4">
            <SheetTitle className="text-h3 font-h3 text-primary">
              UniShare
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-1">
            {/* Home */}
            <Link
              href={ROUTES.HOME}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium transition-colors ${
                pathname === "/"
                  ? "bg-primary-container/10 text-primary"
                  : "text-on-surface hover:bg-surface-container"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>

            {/* Browse */}
            <Link
              href={ROUTES.ITEMS}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium transition-colors ${
                pathname === "/items" || pathname.startsWith("/items/")
                  ? "bg-primary-container/10 text-primary"
                  : "text-on-surface hover:bg-surface-container"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Search className="h-5 w-5" />
              Browse
            </Link>

            {/* Dashboard – only for logged in */}
            {isAuthenticated && (
              <Link
                href={ROUTES.DASHBOARD}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface hover:bg-surface-container"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            )}

            {/* Admin – only for admins */}
            {isAuthenticated && user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium transition-colors ${
                  pathname === "/admin" || pathname.startsWith("/admin/")
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface hover:bg-surface-container"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}

            <div className="border-t border-outline-variant my-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href={ROUTES.PROFILE}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium text-on-surface hover:bg-surface-container transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <Link
                    href={ROUTES.SETTINGS}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium text-on-surface hover:bg-surface-container transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href={ROUTES.LOGIN}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium text-primary hover:bg-primary-container/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Theme Toggle in mobile */}
            <div className="border-t border-outline-variant mt-2 pt-2 px-3">
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
