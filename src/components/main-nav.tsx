
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
  ShieldCheck,
  School
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserRole } from '@/lib/types';


const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/reading', icon: BookOpen, label: 'Reading', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/listening', icon: Headphones, label: 'Listening', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/quizzes', icon: ClipboardList, label: 'Quizzes', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/teacher', icon: School, label: 'Teacher Dashboard', roles: ['teacher', 'admin', 'superadmin'] },
  { href: '/admin', icon: ShieldCheck, label: 'Admin Dashboard', roles: ['admin', 'superadmin'] },
];

interface MainNavProps {
    isMobile?: boolean;
    isCollapsed?: boolean;
    userRole?: UserRole;
}

export function MainNav({ isMobile = false, isCollapsed = false, userRole }: MainNavProps) {
  const navClass = isMobile ? "" : "grid items-start px-2 text-sm font-medium lg:px-4";

  const navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));

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
