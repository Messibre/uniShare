"use client";

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
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLogout } from "@/lib/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/lib/utils/constants";
import { getInitials } from "@/lib/utils/format";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  const navLinks = [
    { href: ROUTES.ITEMS, label: "Browse", icon: Home },
    { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-outline-variant shadow-[--shadow-level-1] dark:shadow-none">
      <div className="container max-w-[--spacing-container-max] mx-auto px-md lg:px-lg h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="text-h3 font-bold text-primary hover:no-underline"
        >
          UniShare
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 text-label-md font-medium transition-colors hover:text-primary ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            type="text"
            placeholder="Search items..."
            className="pl-10 bg-surface-container-low border-outline rounded-full h-9 text-body-sm focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Add Item */}
          {isAuthenticated && (
            <Link
              href={ROUTES.CREATE_ITEM}
              className="hidden lg:inline-flex items-center gap-1 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-4 py-2 rounded-md text-label-md font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Link>
          )}

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
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-on-surface">
                      {user.fullName}
                    </p>
                    <p className="text-xs leading-none text-on-surface-variant">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
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
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant flex justify-around items-center px-md h-16 shadow-[0_-1px_3px_0_rgba(0,0,0,0.1)]">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-label-sm font-medium transition-colors py-1 px-4 rounded-full ${
                isActive
                  ? "bg-primary-container text-on-primary-container scale-95 shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
        {/* Mobile Add Item FAB */}
        {isAuthenticated && (
          <Link
            href={ROUTES.CREATE_ITEM}
            className="flex flex-col items-center gap-0.5 text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-1 px-4"
          >
            <Plus className="h-5 w-5" />
            <span>Add</span>
          </Link>
        )}
        <Link
          href={isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN}
          className={`flex flex-col items-center gap-0.5 text-label-sm font-medium transition-colors py-1 px-4 rounded-full ${
            pathname === ROUTES.PROFILE || pathname === ROUTES.LOGIN
              ? "bg-primary-container text-on-primary-container scale-95 shadow-sm"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <User className="h-5 w-5" />
          <span>{isAuthenticated ? "Profile" : "Sign In"}</span>
        </Link>
      </div>
    </header>
  );
}
