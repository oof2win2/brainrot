import Link from "next/link";
import React from "react";
import { BiSolidDashboard } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { Button } from "../ui/button";

const SIDEBAR = [
  {
    icon: <HiHome className="scale-150" />,
    label: "Home",
    href: "/",
  },
  {
    icon: <BiSolidDashboard className="scale-150" />,
    label: "Videos",
    href: "/videos",
  },
];

export default function Navbar() {
  return (
    <div className="h-full w-20 p-2 flex flex-col gap-4 border-r-2 border-border">
      {SIDEBAR.map((item) => (
        <Link href={item.href} key={item.href}>
          <Button
            variant="ghost"
            className="w-16 h-16 rounded-2xl p-2 pt-4 flex flex-col items-center"
          >
            <span className="opacity-60">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
