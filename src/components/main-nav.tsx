"use client";

import React from 'react';
import NavLink from '@/components/nav-link';
import {
  BookOpen,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/reading', icon: BookOpen, label: 'Reading' },
  { href: '/listening', icon: Headphones, label: 'Listening' },
  { href: '/quizzes', icon: ClipboardList, label: 'Quizzes' },
];

export function MainNav({ isMobile = false }: { isMobile?: boolean }) {
  const navClass = isMobile ? "" : "grid items-start px-2 text-sm font-medium lg:px-4";
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
