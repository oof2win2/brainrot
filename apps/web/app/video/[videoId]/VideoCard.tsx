import { Button } from "@/components/ui/button";
import React from "react";
import { HiAnnotation, HiHeart, HiPaperAirplane } from "react-icons/hi";

export default function VideoCard() {
  return (
    <div className="relative aspect-[9/16] isolate h-full mx-auto rounded-3xl overflow-hidden bg-black">
      <div className="flex flex-col gap-2 p-4 absolute inset-0 z-40">
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
