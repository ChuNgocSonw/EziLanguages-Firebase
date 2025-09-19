
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
  School,
  BookCopy,
  BarChart2,
  Send,
  Mic
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserRole } from '@/lib/types';


const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: [] },
  { href: '/assignments', icon: BookCopy, label: 'Assignments', roles: ['student'] },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/reading', icon: Mic, label: 'Reading', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/listening', icon: Headphones, label: 'Listening', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/quizzes', icon: ClipboardList, label: 'Quizzes', roles: ['student', 'teacher', 'admin', 'superadmin'] },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', roles: ['student'] },
  { href: '/feedback', icon: Send, label: 'Feedback', roles: ['student'] },
  { href: '/teacher', icon: School, label: 'Teacher', roles: ['teacher', 'admin', 'superadmin'] },
  { href: '/admin', icon: ShieldCheck, label: 'Admin', roles: ['admin', 'superadmin'] },
];

interface MainNavProps {
    isMobile?: boolean;
    isCollapsed?: boolean;
    userRole?: UserRole;
}

export function MainNav({ isMobile = false, isCollapsed = false, userRole }: MainNavProps) {
  const navClass = isMobile ? "" : "grid items-start px-2 text-sm font-medium lg:px-4";

  let navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));
  
  if (userRole === 'teacher') {
    navItems = navItems.sort((a, b) => {
        if (a.href === '/teacher') return -1;
        if (b.href === '/teacher') return 1;
        return 0;
    });
  }

  if (userRole === 'admin' || userRole === 'superadmin') {
    navItems = navItems.sort((a, b) => {
      const order = ['/admin', '/teacher'];
      const aIndex = order.indexOf(a.href);
      const bIndex = order.indexOf(b.href);

      if (aIndex > -1 && bIndex > -1) {
        return aIndex - bIndex;
      }
      if (aIndex > -1) {
        return -1;
      }
      if (bIndex > -1) {
        return 1;
      }
      return 0;
    });
  }


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
