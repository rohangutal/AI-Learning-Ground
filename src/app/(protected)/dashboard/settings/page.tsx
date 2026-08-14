"use client";

import { SlideUp } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsProfilePage() {
  return (
    <SlideUp delay={0.1}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>
        <div className="bg-border h-[1px] w-full" />
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Rohan" placeholder="Your name" />
            <p className="text-[0.8rem] text-muted-foreground">
              This is your public display name.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue="student@studyos.ai" disabled />
            <p className="text-[0.8rem] text-muted-foreground">
              Your email address is managed through your provider.
            </p>
          </div>
          <Button>Update profile</Button>
        </div>
      </div>
    </SlideUp>
  );
}
