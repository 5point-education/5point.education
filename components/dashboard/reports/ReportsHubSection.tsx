"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ReportsHubSectionProps {
  title: string;
  description?: string;
  /** Section icon shown next to title (optional). */
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Optional class for the card. */
  className?: string;
}

/**
 * A section block in the reports hub (e.g. "Performance", "Batch analytics").
 * Use for both teacher and student reports; supports static or dynamic content.
 */
export function ReportsHubSection({
  title,
  description,
  icon,
  children,
  className,
}: ReportsHubSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}
