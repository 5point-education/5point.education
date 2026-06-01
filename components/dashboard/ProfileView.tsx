"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Shield, Calendar, User as UserIcon, Pencil, Save, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const client = createClient();
      const { data: { user: u } } = await client.auth.getUser();
      setUser(u ?? null);
      if (u?.user_metadata?.name) {
        setNewName(u.user_metadata.name);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const client = createClient();
      const { data, error } = await client.auth.updateUser({
        data: { name: newName }
      });

      if (error) throw error;

      setUser(data.user);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user?.user_metadata?.name) {
      setNewName(user.user_metadata.name);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[240px] sm:min-h-[280px] rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <CardContent className="py-10 sm:py-12 px-4 sm:px-6 text-center text-muted-foreground text-sm">
          Unable to load profile. Please sign in again.
        </CardContent>
      </Card>
    );
  }

  const name = user.user_metadata?.name ?? user.email ?? "User";
  const initial = name.charAt(0).toUpperCase();
  const role = (user.user_metadata?.role as string) ?? "—";
  const roleLabel = role !== "—" ? role.toLowerCase().replace(/_/g, " ") : "—";
  const displayInitial = isEditing ? newName.charAt(0).toUpperCase() : initial;

  return (
    <div className="w-full">
      <Card className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
        {/* Header: Clean, minimal design without the blue block */}
        <div className="px-6 py-8 sm:p-10 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 w-full">
              {/* Avatar Container */}
              <div
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white border-4 border-blue-100 ring-2 ring-orange-50/50 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative"
                aria-hidden
              >
                <span className="text-4xl sm:text-5xl font-bold text-blue-600">{displayInitial}</span>
              </div>

              {/* Name & Role Info */}
              <div className="text-center sm:text-left min-w-0 flex-1 w-full sm:w-auto mt-2 sm:mt-0">
                {isEditing ? (
                  <div className="flex flex-col gap-3 w-full max-w-md mx-auto sm:mx-0">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Display Name</label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-background text-foreground border-input h-10 text-lg font-medium"
                        placeholder="Enter your name"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center sm:items-start gap-2">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{name}</h2>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-muted text-sm font-medium capitalize">
                      {roleLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end mt-4 sm:mt-0 self-start sm:self-center">
              {isEditing ? (
                <>
                  <Button
                    variant="default"
                    className="shadow-sm font-medium min-w-[100px] bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isUpdating ? "Saving" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-w-[100px]"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="min-w-[120px] bg-background border-input hover:bg-accent hover:text-accent-foreground transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details (Grid layout for full-screen feel) */}
        <CardContent className="p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">

            {/* Column 1: Contact Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                Personal Information
              </h3>
              <div className="space-y-5">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  {isEditing ? (
                    <p className="text-base text-muted-foreground italic">Editing above...</p>
                  ) : (
                    <p className="text-base sm:text-lg font-medium text-foreground">{name}</p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base sm:text-lg font-medium text-foreground break-all">{user.email ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Account Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Account Details
              </h3>
              <div className="space-y-5">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-base sm:text-lg font-medium text-foreground capitalize">{roleLabel}</p>
                </div>

                {(user.created_at || user.last_sign_in_at) && (
                  <div className="space-y-4">
                    {user.created_at && (
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base font-medium text-foreground">{format(new Date(user.created_at), "PPP")}</p>
                        </div>
                      </div>
                    )}

                    {user.last_sign_in_at && (
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                        <p className="text-base font-medium text-foreground">{format(new Date(user.last_sign_in_at), "PPp")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
