import Navbar from "@/components/layout/Navbar";
import React from "react";

export default function NavbarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-screen h-screen">
      <Navbar />
      {children}
    </div>
  );
}
