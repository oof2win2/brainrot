"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    console.log("submit");
    setLoading(false);
  }

  return (
    <div className="w-full h-screen grid place-items-center">
      <Tabs defaultValue="account" className="max-w-xl w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="link">Link</TabsTrigger>
        </TabsList>
        <div className="max-w-xl mt-2 w-full p-4 rounded-2xl border-border border-2">
          <TabsContent className="mt-0" value="upload">
            <div className="space-y-4">
              <Label htmlFor="file">Upload Video</Label>
              <Input
                id="file"
                type="file"
                accept="video/*"
                className="cursor-pointer"
              />
            </div>
          </TabsContent>
          <TabsContent className="mt-0" value="link">
            <div className="space-y-4">
              <Label htmlFor="videoLink">Video URL</Label>
              <Input
                id="videoLink"
                type="url"
                placeholder="Enter video URL here..."
              />
            </div>
          </TabsContent>
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? "Generating..." : "Generate brainrot"}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
