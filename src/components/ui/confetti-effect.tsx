"use client";

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiEffectProps {
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function ConfettiEffect({
  show,
  duration = 3000,
  onComplete,
}: ConfettiEffectProps) {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={300}
      gravity={0.2}
      colors={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e']}
      tweenDuration={5000}
    />
  );
}