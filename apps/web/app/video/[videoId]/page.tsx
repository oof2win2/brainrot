import React from "react";
import VideoCard from "./VideoCard";

export default function VideoPage({
  params: { videoId },
}: {
  params: { videoId: string };
}) {
  return (
    <div className="w-full h-screen p-4">
      <VideoCard />
    </div>
  );
}
