import React from "react";
import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";

export default function LoginPage() {
  return (
    <div className="w-screen h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold">Login to continue</h1>
        <Button className="flex items-center gap-2">
          <FaGithub className="text-xl" />
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}
