"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck,
  Copy,
  ExternalLink,
  Laptop,
  LogOut,
  Moon,
  ShieldAlert,
  Sun,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  useUpdateProfile,
  useChangePassword,
  useLogout,
} from "@/lib/hooks/useAuth";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline bg-surface p-6 shadow-[var(--shadow-level-1)]">
      <div className="mb-5 space-y-1">
        <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
        {description && (
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline/60 py-3 last:border-b-0">
      <dt className="text-body-sm text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 text-right text-body-sm font-medium text-on-surface">
        {children}
      </dd>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-label-sm text-error">{message}</p>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success("Profile updated successfully");
      profileForm.reset(data);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const copyUserId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success("Account ID copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => router.push(ROUTES.LOGIN),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-h2 font-semibold text-on-surface">Settings</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage your account details, security and how UniShare looks for you.
        </p>
      </div>

      <Tabs defaultValue="account" className="flex w-full flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-surface-container-low">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* ACCOUNT */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Panel
            title="Personal details"
            description="Your name and contact details are shown to people you rent with."
          >
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...profileForm.register("fullName")} />
                <FieldError
                  message={profileForm.formState.errors.fullName?.message}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                  />
                  <FieldError
                    message={profileForm.formState.errors.email?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...profileForm.register("phone")}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={
                  profileForm.formState.isSubmitting ||
                  !profileForm.formState.isDirty
                }
                className="bg-primary-container text-on-primary-container hover:bg-primary-container/90"
              >
                {profileForm.formState.isSubmitting
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </form>
          </Panel>

          <Panel
            title="Account information"
            description="Details tied to your UniShare account."
          >
            <dl>
              <InfoRow label="Account type">
                {user?.role === "ADMIN" ? "Administrator" : "Student"}
              </InfoRow>
              <InfoRow label="ID verification">
                {user?.isIdVerified ? (
                  <Badge className="gap-1 border-success/30 bg-success/15 text-success">
                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="gap-1 border-warning/30 bg-warning/15 text-warning">
                    <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                    Not verified
                  </Badge>
                )}
              </InfoRow>
              {user?.createdAt && (
                <InfoRow label="Member since">
                  {formatDate(user.createdAt)}
                </InfoRow>
              )}
              <InfoRow label="Account ID">
                <button
                  type="button"
                  onClick={copyUserId}
                  className="inline-flex max-w-full items-center gap-2 rounded-md font-mono text-label-md text-on-surface-variant transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Copy account ID"
                >
                  <span className="truncate">{user?.id}</span>
                  <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </button>
              </InfoRow>
            </dl>
            {!user?.isIdVerified && (
              <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-body-sm text-on-surface-variant">
                You need a verified ID before you can rent or list items.
              </p>
            )}
          </Panel>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Panel
            title="Change password"
            description="Use at least 8 characters. You will stay signed in on this device."
          >
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                />
                <FieldError
                  message={passwordForm.formState.errors.currentPassword?.message}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                  <FieldError
                    message={passwordForm.formState.errors.newPassword?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  <FieldError
                    message={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                className="bg-primary-container text-on-primary-container hover:bg-primary-container/90"
              >
                {passwordForm.formState.isSubmitting
                  ? "Changing..."
                  : "Change password"}
              </Button>
            </form>
          </Panel>

          <Panel
            title="Session"
            description="Sign out of UniShare on this device."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface-variant">
                Signed in as{" "}
                <span className="font-medium text-on-surface">
                  {user?.email}
                </span>
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2 border-outline text-on-surface hover:bg-surface-container"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </Panel>
        </TabsContent>

        {/* PREFERENCES */}
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Panel
            title="Appearance"
            description="Choose how UniShare looks on this device."
          >
            <div
              role="radiogroup"
              aria-label="Theme"
              className="grid grid-cols-3 gap-3"
            >
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = mounted && theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-label-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Legal and help"
            description="Read how UniShare handles rentals and your data."
          >
            <ul className="space-y-1">
              {[
                { href: "/terms", label: "Terms of service" },
                { href: "/privacy", label: "Privacy policy" },
                { href: "/about", label: "About UniShare" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high hover:no-underline"
                  >
                    {link.label}
                    <ExternalLink
                      className="h-4 w-4 text-on-surface-variant"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
