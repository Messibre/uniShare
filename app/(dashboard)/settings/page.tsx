"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUpdateProfile, useChangePassword } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

export default function SettingsPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Password form
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-h2 font-h2 text-on-surface">Settings</h1>

      {/* Profile Settings */}
      <Card className="bg-surface border-outline-variant">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-h3 font-h3 text-on-surface">Personal Details</h2>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...profileForm.register("fullName")} />
              {profileForm.formState.errors.fullName && (
                <p className="text-label-sm text-error">
                  {profileForm.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...profileForm.register("email")}
              />
              {profileForm.formState.errors.email && (
                <p className="text-label-sm text-error">
                  {profileForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...profileForm.register("phone")} />
            </div>
            <Button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
            >
              {profileForm.formState.isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card className="bg-surface border-outline-variant">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-h3 font-h3 text-on-surface">Change Password</h2>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-label-sm text-error">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-label-sm text-error">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-label-sm text-error">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
            >
              {passwordForm.formState.isSubmitting
                ? "Changing..."
                : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
