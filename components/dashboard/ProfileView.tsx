"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Shield, Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const client = createClient();
      const { data: { user: u } } = await client.auth.getUser();
      setUser(u ?? null);
      setLoading(false);
    };
    loadUser();
  }, []);

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

  return (
    <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      {/* Header: gradient bar + avatar & name */}
      <div className="bg-gradient-to-r from-primary to-primary-light px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10">
        <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 ring-2 ring-white/30 shadow-lg"
            aria-hidden
          >
            <span className="text-2xl sm:text-3xl font-bold text-white">{initial}</span>
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">{name}</h2>
            <p className="text-white/90 text-sm mt-0.5 capitalize">{roleLabel}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
        <ul className="space-y-0 divide-y divide-gray-100">
          <li className="flex items-center gap-3 sm:gap-4 py-4 first:pt-0 min-h-[3rem] sm:min-h-[3.5rem]">
            <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
              <Mail className="h-5 w-5 sm:h-[1.25rem] sm:w-[1.25rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-foreground break-all mt-0.5">{user.email ?? "—"}</p>
            </div>
          </li>
          <li className="flex items-center gap-3 sm:gap-4 py-4 min-h-[3rem] sm:min-h-[3.5rem]">
            <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
              <UserIcon className="h-5 w-5 sm:h-[1.25rem] sm:w-[1.25rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{name}</p>
            </div>
          </li>
          <li className="flex items-center gap-3 sm:gap-4 py-4 min-h-[3rem] sm:min-h-[3.5rem]">
            <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
              <Shield className="h-5 w-5 sm:h-[1.25rem] sm:w-[1.25rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-foreground capitalize mt-0.5">{roleLabel}</p>
            </div>
          </li>
          {(user.created_at || user.last_sign_in_at) && (
            <li className="flex items-center gap-3 sm:gap-4 py-4 min-h-[3rem] sm:min-h-[3.5rem]">
              <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
                <Calendar className="h-5 w-5 sm:h-[1.25rem] sm:w-[1.25rem]" />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                {user.created_at && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member since</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{format(new Date(user.created_at), "PPP")}</p>
                  </div>
                )}
                {user.last_sign_in_at && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last sign in</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{format(new Date(user.last_sign_in_at), "PPp")}</p>
                  </div>
                )}
              </div>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
