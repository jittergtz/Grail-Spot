import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Eye, Heart, Share2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to Grail Spot!",
      description: "A community where people share aesthetic quality products they love, and discover new ones.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Eye,
      title: "Discover Quality Products",
      description: "Browse through curated products shared by the community. Use categories to find exactly what you're looking for.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Heart,
      title: "Share Your Favorites",
      description: "Found something amazing? Share it with the community! Add products to inspire others.",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      icon: Share2,
      title: "Community Guidelines",
      description: "Only share quality, aesthetic products. Be respectful and keep descriptions accurate. Let's build an amazing collection together!",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog  open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px]  w-full overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
       


          <div className="p-8 pt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {/* Icon */}
               

                {/* Content */}
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-semibold">{currentStepData.title}</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Step indicators */}
                <div className="flex justify-center gap-2 pt-4">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-8 bg-primary"
                          : index < currentStep
                          ? "w-2 bg-primary/50"
                          : "w-2 bg-secondary"
                      }`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  {!isLastStep && (
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className={`${isLastStep ? 'w-full' : 'flex-1'} gap-2`}
                  >
                    {isLastStep ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Get Started
                      </>
                    ) : (
                      "Next"
                    )}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
