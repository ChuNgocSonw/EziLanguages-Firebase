
"use client";

import React from 'react';
import NavLink from '@/components/nav-link';
import {
  BookOpen,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Trophy,
  User,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/reading', icon: BookOpen, label: 'Reading' },
  { href: '/listening', icon: Headphones, label: 'Listening' },
  { href: '/quizzes', icon: ClipboardList, label: 'Quizzes' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MainNav({ isMobile = false, isCollapsed = false }: { isMobile?: boolean, isCollapsed?: boolean }) {
  const navClass = isMobile ? "" : "grid items-start px-2 text-sm font-medium lg:px-4";

  if (isCollapsed) {
    return (
       <TooltipProvider>
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
             <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                    <NavLink href={item.href} icon={item.icon} isCollapsed={isCollapsed}>
                        <span className="sr-only">{item.label}</span>
                    </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                   {item.label}
                </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    )
  }

  return (
    <nav className={navClass}>
      {navItems.map((item) => (
        <NavLink key={item.href} href={item.href} icon={item.icon} isMobile={isMobile}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
