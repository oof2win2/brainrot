"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState, useRef } from "react";
import { HiAnnotation, HiHeart, HiPaperAirplane } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

interface SubtitleData {
  text: string;
  startTime: number;
  endTime: number;
  textColor: string;
  strokeColor: string;
}

interface VisibleText extends SubtitleData {
  rotation: number;
}

export default function VideoCard({ data }: { data: SubtitleData[] }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleTexts, setVisibleTexts] = useState<VisibleText[]>([]);
  const rotationsRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / 1000; // Convert to seconds
      setCurrentTime(progress);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const getRandomRotation = () => Math.random() * 6 - 3;

    const visible = data
      .filter(
        (item) => currentTime >= item.startTime && currentTime <= item.endTime
      )
      .map((item) => {
        // Get existing rotation or create new one
        if (!rotationsRef.current.has(item.startTime)) {
          rotationsRef.current.set(item.startTime, getRandomRotation());
        }
        return {
          ...item,
          rotation: rotationsRef.current.get(item.startTime)!,
        };
      });
    setVisibleTexts(visible);
  }, [currentTime, data]);

  return (
    <div className="relative aspect-[9/16] isolate h-full mx-auto rounded-3xl overflow-hidden bg-black">
      <div className="flex flex-col gap-2 p-4 absolute inset-0 z-40">
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {visibleTexts.map((item) => (
              <motion.div
                key={item.startTime}
                initial={{ opacity: 0, scale: 0.95, rotate: item.rotation }}
                animate={{ opacity: 1, scale: 1, rotate: item.rotation }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.1,
                  ease: "easeOut",
                }}
                className="mb-2 text-center"
              >
                <span
                  className="text-4xl font-bold"
                  style={{
                    color: item.textColor,
                  }}
                >
                  {item.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="relative w-full h-full">
          <div className="absolute right-0 bottom-0 pb-24 flex flex-col gap-4">
            <Button
              variant="ghost"
              className="text-white w-16 h-16 bg-white/10 rounded-full"
            >
              <HiHeart className="scale-150" />
            </Button>
            <Button
              variant="ghost"
              className="text-white w-16 h-16 bg-white/10 rounded-full"
            >
              <HiAnnotation className="scale-150" />
            </Button>
            <Button
              variant="ghost"
              className="text-white w-16 h-16 bg-white/10 rounded-full"
            >
              <HiPaperAirplane className="scale-150" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
