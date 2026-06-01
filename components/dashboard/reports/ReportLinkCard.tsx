"use client";

import Link from "next/link";
import { type LucideIcon, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ReportLinkCardProps {
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  /** For future subscription: show lock and disable link. */
  locked?: boolean;
  /** Optional badge e.g. "Premium" – use when gating behind subscription. */
  badge?: string;
  /** Optional id for analytics or subscription checks. */
  id?: string;
}

/**
 * Single report entry card. Reusable for teacher/student reports hub.
 * Use locked/badge when adding subscription gating later.
 */
export function ReportLinkCard({
  title,
  description,
  href,
  icon: Icon,
  locked = false,
  badge,
  id,
}: ReportLinkCardProps) {
  const content = (
    <>
      <span className="flex-1 min-w-0 text-left">
        <span className="font-medium block truncate">{title}</span>
        {description && (
          <span className="text-muted-foreground text-sm block truncate">{description}</span>
        )}
      </span>
      {badge && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {badge}
        </Badge>
      )}
      {locked ? (
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  if (locked) {
    return (
      <div
        id={id}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg border border-border bg-muted/30 px-4 py-3 cursor-not-allowed opacity-80"
        )}
        aria-disabled
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {content}
      </div>
    );
  }

  return (
    <Button
      id={id}
      variant="outline"
      className="w-full justify-between h-auto py-3 px-4"
      asChild
    >
      <Link href={href} className="flex items-center gap-3 w-full">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {content}
      </Link>
    </Button>
  );
}
