"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ChoosePlatforms } from "@/components/create-post/choose-platforms";
import { PostType } from "@/components/create-post/post-type";
import GenerateContent from "@/components/generate-content-unified";
import PreviewPost from "@/components/create-post/preview-post";
import { SchedulePost } from "@/components/create-post/schedule-post";

const steps = [
  { id: 1, name: "Choose Platforms" },
  { id: 2, name: "Post Type" },
  { id: 3, name: "Generate Content" },
  { id: 4, name: "Preview" },
  { id: 5, name: "Schedule" },
];

export function CreatePostWizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ChoosePlatforms />;
      case 2:
        return <PostType />;
      case 3:
        return <GenerateContent />;
      case 4:
        return <PreviewPost />;
      case 5:
        return <SchedulePost />;
      default:
        return <ChoosePlatforms />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                currentStep >= step.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-background text-primary"
                    : "border-muted-foreground bg-background text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <span className="mt-2 text-xs">{step.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 h-1 w-full bg-muted">
          <div
            className="h-1 bg-primary transition-all"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStep()}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep !== 5 && (
              <Button onClick={nextStep} disabled={currentStep === steps.length}>
                {currentStep === steps.length - 1 ? "Schedule" : "Next"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
