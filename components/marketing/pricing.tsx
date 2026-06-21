"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    description: "Perfect for casual learners.",
    price: "$0",
    features: ["Basic Notes Editor", "3 PDF uploads per month", "Standard AI Summaries"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious students.",
    price: "$9",
    features: ["Unlimited Notes", "Unlimited PDF & YouTube parsing", "Advanced AI Tutor Chat", "Knowledge Graph Export"],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start for free, upgrade when you need supercharged AI capabilities.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto grid max-w-4xl sm:grid-cols-2 gap-8">
          {plans.map((plan, index) => (
            <SlideUp key={plan.name} delay={0.2 * index}>
              <Card className={`relative h-full flex flex-col ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-6 translate-y-[-50%]">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}
