"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useResetPassword } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GuestRoute } from "@/components/auth/GuestRoute";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useResetPassword();

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync({
        token: params.token,
        password: data.password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 3000);
    } catch (error: any) {
      const message =
        error.message || "Invalid or expired token. Please try again.";
      setError("root", { message });
    }
  };

  return (
    <GuestRoute>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[--shadow-level-1] p-6 lg:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-h2 font-h2 text-primary">Set New Password</h1>
          <p className="text-body-sm text-on-surface-variant">
            Enter your new password below.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <p className="text-body-md text-on-surface-variant">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-label-md text-on-surface-variant"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                  className="bg-surface-container-low border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 pr-10"
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="text-label-sm text-error mt-1"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-label-md text-on-surface-variant"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className="bg-surface-container-low border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 pr-10"
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-label-sm text-error mt-1"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-all shadow-sm"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            {errors.root && (
              <p className="text-label-sm text-error text-center mt-2">
                {errors.root.message}
              </p>
            )}
          </form>
        )}

        <div className="text-center text-body-sm text-on-surface-variant">
          <Link
            href={ROUTES.LOGIN}
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </GuestRoute>
  );
}
