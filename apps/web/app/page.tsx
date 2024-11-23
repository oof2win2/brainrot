import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { HiHome } from "react-icons/hi";
import { BiSolidDashboard } from "react-icons/bi";

const SIDEBAR = [
  {
    icon: <HiHome className="text-4xl" />,
    label: "Home",
    href: "/",
  },
  {
    icon: <BiSolidDashboard className="text-4xl" />,
    label: "Videos",
    href: "/videos",
  },
];

export default function Home() {
  return (
    <div className="w-screen h-screen flex">
      <div className="h-full w-20 p-2 bg-red-100 flex flex-col gap-4">
        {SIDEBAR.map((item) => (
          <Link href={item.href} key={item.href}>
            <Button
              variant="ghost"
              className="w-16 h-16 rounded-2xl p-2 flex flex-col items-center"
            >
              <span className="opacity-60">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
