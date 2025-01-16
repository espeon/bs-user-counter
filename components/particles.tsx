import { useEffect, useState, useCallback } from "react";
import { confetti } from "@tsparticles/confetti";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Component({
  isAnimating,
  setIsAnimating,
}: {
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
}) {
  const [isBlocked, setIsBlocked] = useState(false);

  const startConfetti = useCallback(() => {
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        setIsAnimating(false);
        clearInterval(interval);
        return;
      }

      const particleCount = 25 * (timeLeft / duration);

      // Launch confetti from the left and right edges
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return interval;
  }, [setIsAnimating]);

  useEffect(() => {
    // Check if confetti is blocked
    try {
      const testConfetti = confetti;
      if (!testConfetti) {
        setIsBlocked(true);
      }
    } catch (e) {
      setIsBlocked(true);
    }
  }, []);
  // turn off confetti in 10 seconds
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      // if not blocked, start confetti
      if (!isBlocked) {
        startConfetti();
      }
      if (Date.now() > 10000) {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnimating, isBlocked, setIsAnimating, startConfetti]);

  // cover the whole page
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 -z-20 bg-transparent"></div>
  );
}
