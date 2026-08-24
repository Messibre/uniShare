"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { useForgotPassword } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GuestRoute } from "@/components/auth/GuestRoute";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      const message =
        error.message || "Something went wrong. Please try again.";
      setError("root", { message });
    }
  };

  return (
    <GuestRoute>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[--shadow-level-1] p-6 lg:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-h2 font-h2 text-primary">Reset Password</h1>
          <p className="text-body-sm text-on-surface-variant">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <p className="text-body-md text-on-surface-variant">
              If an account exists with that email, we've sent a reset link.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block text-primary font-semibold hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-all shadow-sm"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
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
