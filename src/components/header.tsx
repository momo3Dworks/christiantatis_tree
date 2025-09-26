
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, Clapperboard, HelpCircle, MessageSquare, Users, Mail, Moon, Sun, Home } from "lucide-react";
import { useTheme } from "next-themes";

const navigationLinks = [
  { href: "/events", label: "Events", icon: <Users /> },
  { href: "/online-bible", label: "Online Bible", icon: <BookOpen /> },
  { href: "/content", label: "Content", icon: <Clapperboard /> },
  { href: "/faq", label: "FAQ", icon: <HelpCircle /> },
  { href: "/forum", label: "Forum", icon: <MessageSquare /> },
  { href: "/contact", label: "Contact Us", icon: <Mail /> },
];

export default function Header() {
  const { setTheme, theme } = useTheme();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
      <div className="h-[60px] rounded-[2rem] bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm shadow-lg flex items-center justify-between px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-black dark:text-white">
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border-white/30 dark:border-gray-700/30 shadow-xl" align="start">
            {navigationLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href} className="flex items-center gap-2 text-black dark:text-white cursor-pointer">
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/"
          className="font-bold text-lg text-[#494848] absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full w-48"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isHovering ? <Home className="text-[#494848]" /> : "CHRISTIANITATIS"}
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="text-black dark:text-white"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
