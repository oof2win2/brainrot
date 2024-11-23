"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
    },
    multiple: false,
  });

  async function handleSubmit() {
    setLoading(true);
    console.log("submit", file);
    setLoading(false);
  }

  return (
    <div className="w-full h-screen grid place-items-center">
      <Tabs defaultValue="upload" className="max-w-xl w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="link">Link</TabsTrigger>
        </TabsList>
        <div className="max-w-xl mt-2 w-full p-4 rounded-2xl border-border border-2">
          <TabsContent className="mt-0" value="upload">
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg px-6 py-12 cursor-pointer transition-colors
                  ${isDragActive ? "border-primary bg-primary/10" : "border-border"}
                  ${file ? "bg-green-50 border-green-500" : ""}
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  {file ? (
                    <p className="text-green-600">Selected: {file.name}</p>
                  ) : isDragActive ? (
                    <p>Drop to upload, or click to select</p>
                  ) : (
                    <p>Drag & drop to upload, or click to select</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent className="mt-0" value="link">
            <div className="space-y-4">
              <Input
                id="videoLink"
                type="url"
                className="h-12 bg-muted rounded-2xl border-none px-4 !text-base font-medium tracking-normal"
                placeholder="Enter video URL here..."
              />
            </div>
          </TabsContent>
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleSubmit}
              className="px-5 py-3 h-auto rounded-2xl text-base font-medium tracking-normal"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate brainrot"}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
