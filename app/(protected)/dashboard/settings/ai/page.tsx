"use client";

import { SlideUp } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SettingsAIPage() {
  return (
    <SlideUp delay={0.1}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">AI Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Configure your AI tutor and summarization models.
          </p>
        </div>
        <div className="bg-border h-[1px] w-full" />
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label>Default AI Model</Label>
            <div className="grid gap-2 mt-2">
              <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-primary/5 border-primary/50">
                <input type="radio" name="ai-model" className="accent-primary" defaultChecked />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">DeepSeek V3 (Recommended)</p>
                  <p className="text-sm text-muted-foreground">Best balance of speed and reasoning.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="radio" name="ai-model" className="accent-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Gemini 2.5 Flash</p>
                  <p className="text-sm text-muted-foreground">Fastest response times.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="radio" name="ai-model" className="accent-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Claude 3.5 Sonnet</p>
                  <p className="text-sm text-muted-foreground">Highest quality writing and coding.</p>
                </div>
              </label>
            </div>
          </div>
          <Button>Save preferences</Button>
        </div>
      </div>
    </SlideUp>
  );
}
