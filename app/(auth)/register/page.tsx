"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRegister } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GuestRoute } from "@/components/auth/GuestRoute";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useRegister();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      const message = error.message || "Registration failed. Please try again.";
      setError("root", { message });
    }
  };

  return (
    <GuestRoute>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[var(--shadow-level-1)] p-6 lg:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-h2 font-h2 text-primary">Create Account</h1>
          <p className="text-body-sm text-on-surface-variant">
            Join the campus rental community.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-label-sm text-error mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-label-sm text-error mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone Number{" "}
              <span className="text-label-sm text-on-surface-variant">
                (optional)
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+251900000000"
              autoComplete="tel"
              {...register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
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
              <p className="text-label-sm text-error mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
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
              <p className="text-label-sm text-error mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {errors.root && (
            <p className="text-label-sm text-error text-center mt-2">
              {errors.root.message}
            </p>
          )}
        </form>

        <div className="text-center text-body-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </GuestRoute>
  );
}
