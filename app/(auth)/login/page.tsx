"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLogin } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestRoute } from "@/components/auth/GuestRoute";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || ROUTES.DASHBOARD;
  const { isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const loginMutation = useLogin();

  // Redirect if already authenticated (GuestRoute will handle this, but for safety)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, router, redirect]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      router.push(redirect);
    } catch (error: any) {
      // Handle API errors
      const message = error.message || "Invalid email or password";
      setError("root", { message });
    }
  };

  return (
    <GuestRoute>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[--shadow-level-1] p-6 lg:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-h2 font-h2 text-primary">Welcome Back</h1>
          <p className="text-body-sm text-on-surface-variant">
            Sign in to your account to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-label-md text-on-surface-variant"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              autoComplete="email"
              {...register("email")}
              className="bg-surface-container-low border-outline focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-label-sm text-error mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-label-md text-on-surface-variant"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
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
              <p id="password-error" className="text-label-sm text-error mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" {...register("remember")} />
              <Label
                htmlFor="remember"
                className="text-label-sm text-on-surface-variant cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-label-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-all shadow-sm"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Root error (API errors) */}
          {errors.root && (
            <p className="text-label-sm text-error text-center mt-2">
              {errors.root.message}
            </p>
          )}
        </form>

        <div className="text-center text-body-sm text-on-surface-variant">
          Don't have an account?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="text-primary font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
          >
            Register
          </Link>
        </div>
      </div>
    </GuestRoute>
  );
}
