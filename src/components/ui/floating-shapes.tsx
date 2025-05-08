"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingShape {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  rotate: number;
  blur: number;
}

interface FloatingShapesProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
}

export function FloatingShapes({
  count = 6,
  colors = ["#3b82f6", "#4f46e5", "#8b5cf6", "#6366f1"],
  minSize = 40,
  maxSize = 120,
  minDuration = 20,
  maxDuration = 40,
}: FloatingShapesProps) {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    
    // Skip animation generation if reduced motion is preferred
    if (!mediaQuery.matches) {
      generateShapes();
    }
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [count]);

  const generateShapes = () => {
    const newShapes: FloatingShape[] = [];
    for (let i = 0; i < count; i++) {
      newShapes.push({
        id: i,
        x: Math.random() * 100, // position as percentage
        y: Math.random() * 100,
        size: minSize + Math.random() * (maxSize - minSize),
        duration: minDuration + Math.random() * (maxDuration - minDuration),
        delay: Math.random() * -maxDuration, // negative delay for staggered starts
        opacity: 0.05 + Math.random() * 0.15,
        rotate: Math.random() * 360,
        blur: 8 + Math.random() * 12,
      });
    }
    setShapes(newShapes);
  };

  // Don't render shapes if reduced motion is preferred
  if (reducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            backgroundColor: colors[shape.id % colors.length],
            opacity: shape.opacity,
            filter: `blur(${shape.blur}px)`,
            zIndex: -10,
          }}
          animate={{
            x: ["0%", "10%", "-10%", "5%", "0%"],
            y: ["0%", "-15%", "5%", "-5%", "0%"],
            rotate: [0, shape.rotate, shape.rotate * 2, shape.rotate, 0],
          }}
          transition={{
            duration: shape.duration,
            ease: "linear",
            repeat: Infinity,
            delay: shape.delay,
          }}
        />
      ))}
    </div>
  );
}