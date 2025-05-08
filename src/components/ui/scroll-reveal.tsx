"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  width?: "fit-content" | "100%";
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  viewOffset?: { top?: number; bottom?: number };
  once?: boolean;
}

export function ScrollReveal({
  children,
  width = "fit-content",
  direction = "up",
  delay = 0,
  viewOffset = { top: 0, bottom: 0 },
  once = true,
}: ScrollRevealProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  
  // Format the margin string properly with px suffix
  const marginTop = `${viewOffset.top || 0}px`;
  const marginBottom = `${viewOffset.bottom || 0}px`;
  
  // Explicitly casting margin string to satisfy TypeScript
  const inView = useInView(ref, { 
    once, 
    margin: `${marginTop} 0px ${marginBottom} 0px` as const
  });
  
  // Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if the browser supports matchMedia and prefersReducedMotion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    // Add listener for changes to the prefers-reduced-motion setting
    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [controls, inView, once]);

  // Set up variants based on direction
  let directionOffset = 50;
  const getDirectionOffset = () => {
    switch (direction) {
      case "up":
        return { y: directionOffset };
      case "down":
        return { y: -directionOffset };
      case "left":
        return { x: directionOffset };
      case "right":
        return { x: -directionOffset };
      default:
        return { y: directionOffset };
    }
  };

  const variants = {
    hidden: {
      opacity: 0,
      ...getDirectionOffset(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay,
      },
    },
  };

  // If user prefers reduced motion, don't animate
  if (reducedMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      style={{ width }}
    >
      {children}
    </motion.div>
  );
}