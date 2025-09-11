"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isMobile?: boolean;
  isCollapsed?: boolean;
}

export default function NavLink({ href, icon: Icon, children, isMobile = false, isCollapsed = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-sidebar-accent text-primary font-semibold",
        isMobile && "text-foreground",
        isCollapsed && "justify-center"
      )}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
