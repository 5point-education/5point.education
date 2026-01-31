"use client";

import { BarChart3 } from "lucide-react";

export interface ReportsHubProps {
  /** Page title (e.g. "Reports"). */
  title: string;
  /** Short description under the title. */
  description: string;
  /** Optional slot for subscription banner / paywall – render above sections when needed. */
  subscriptionBanner?: React.ReactNode;
  children: React.ReactNode;
  /** Optional class for the outer container. */
  className?: string;
}

/**
 * Shared layout for reports hub pages (teacher + student).
 * Central place to add subscription gating later via subscriptionBanner or layout-level check.
 */
export function ReportsHub({
  title,
  description,
  subscriptionBanner,
  children,
  className,
}: ReportsHubProps) {
  return (
    <div className={`space-y-8 max-w-4xl mx-auto py-8 pt-20 md:pt-8 ${className ?? ""}`}>
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </header>

      {subscriptionBanner && <div className="rounded-lg border bg-muted/50 p-4">{subscriptionBanner}</div>}

      <div className="space-y-6">{children}</div>
    </div>
  );
}
