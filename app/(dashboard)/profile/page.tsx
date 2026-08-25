"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useUser } from "@/lib/hooks/useAuth";
import { formatDate, getInitials } from "@/lib/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: userData, isLoading } = useUser();

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const profile = userData || user;

  if (!profile) {
    return <div>User not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-h2 font-h2 text-on-surface">Profile</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface border-outline-variant">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary-container/10 text-primary-container">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Full Name</p>
              <p className="text-body-lg font-semibold text-on-surface">
                {profile.fullName}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-outline-variant">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary-container/10 text-secondary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Email</p>
              <p className="text-body-lg font-semibold text-on-surface">
                {profile.email}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-outline-variant">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-tertiary-container/10 text-tertiary">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Phone</p>
              <p className="text-body-lg font-semibold text-on-surface">
                {profile.phone || "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Profile Card */}
      <Card className="bg-surface border-outline-variant">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary-container/20">
              <AvatarFallback className="bg-primary-container/10 text-primary-container text-2xl">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-h3 font-h3 text-on-surface">
                {profile.fullName}
              </h2>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-surface-container-high text-on-surface-variant"
                >
                  {profile.role}
                </Badge>
                {profile.isIdVerified ? (
                  <Badge className="bg-green-500/15 text-green-600 border-green-500/20 gap-1">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/20 gap-1">
                    <XCircle className="h-3 w-3" /> Pending Verification
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Calendar className="h-4 w-4" />
              Joined {profile.createdAt ? formatDate(profile.createdAt) : "N/A"}
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <User className="h-4 w-4" />
              {profile.role === "ADMIN" ? "Administrator" : "Student"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
