"use client";

import { Button } from "@/components/ui/button";

type PageStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
};

export function PageState({ title, description, action }: PageStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button className="mt-5" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
