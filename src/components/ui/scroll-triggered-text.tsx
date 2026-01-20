"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

export const ScrollTriggeredText = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  delay = 0,
  twoLines = false,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  delay?: number;
  twoLines?: boolean;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasStarted, setHasStarted] = useState(false);
  
  // Handle two-line formatting for specific titles
  let wordsArray: string[];
  if (twoLines && words.includes("Amsterdam's First Creative Tech Community")) {
    // Split into two lines: "Amsterdam's First" and "Creative Tech Community"
    wordsArray = ["Amsterdam's", "First", "\n", "Creative", "Tech", "Community"];
  } else {
    wordsArray = words.split(" ");
  }

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timer = setTimeout(() => {
        setHasStarted(true);
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, hasStarted, delay]);

  const renderWords = () => {
    return (
      <motion.div ref={ref}>
        {wordsArray.map((word, idx) => {
          // Handle line breaks
          if (word === "\n") {
            return <br key={`br-${idx}`} />;
          }
          
          return (
            <motion.span
              key={word + idx}
              className="text-white opacity-0"
              style={{
                filter: filter ? "blur(10px)" : "none",
              }}
              animate={hasStarted ? {
                opacity: 1,
                filter: filter ? "blur(0px)" : "none",
              } : {}}
              transition={{
                duration: duration,
                delay: idx * 0.1,
                ease: "easeOut"
              }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn(className)}>
      <div className="mt-4">
        <div className="text-white">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};