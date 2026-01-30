"use client";

import { ProfileView } from "@/components/dashboard/ProfileView";

export default function StudentProfilePage() {
  return (
    <div className="space-y-6 sm:space-y-8 px-4 py-6 sm:p-6 md:p-8 pt-20 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm">Your account details.</p>
      </div>
      <div className="max-w-2xl w-full">
        <ProfileView />
      </div>
    </div>
  );
}
