
"use client";

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, School, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MainNav } from '@/components/main-nav';
import { AuthProvider } from '@/context/auth-provider';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeSwitcher } from '@/components/theme-switcher';

// Create a context to hold the scroll area ref
const ScrollContext = createContext<React.RefObject<HTMLDivElement> | null>(null);
export const useScroll = () => useContext(ScrollContext);

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (loading) {
      return;
    }

    // If there's no user after loading, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If email is not verified, redirect to verification page, allowing access to profile
    if (!user.emailVerified && !user.email?.endsWith('@ezilanguages.com')) {
        if (pathname !== '/profile') {
            router.push('/verify-email');
            return;
        }
    }
    
    // Wait until the userProfile is loaded from Firestore
    if (!userProfile) {
      return;
    }

    // Once userProfile is available, perform role-based route protection
    if (pathname.startsWith('/admin') && !['admin', 'superadmin'].includes(userProfile.role)) {
      router.push('/dashboard'); 
    }
    
    if (pathname.startsWith('/teacher') && !['admin', 'teacher', 'superadmin'].includes(userProfile.role)) {
      router.push('/dashboard');
    }

  }, [user, userProfile, loading, router, pathname]);

  // Display a loading state while waiting for user or userProfile
  if (loading || !user) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50">
          <div className="p-4 rounded-lg flex flex-col items-center gap-6 text-center">
            <Logo width={80} height={80} />
            <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-jump [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-jump [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-jump"></div>
            </div>
          </div>
      </div>
    );
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <ScrollContext.Provider value={scrollAreaRef}>
    <div className={cn(
        "grid min-h-screen w-full",
        isSidebarCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[280px_1fr]",
        "transition-all duration-300 ease-in-out"
    )}>
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className={cn(
              "flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6",
              isSidebarCollapsed && "justify-center"
            )}>
             {!isSidebarCollapsed && (
                <Link href="/dashboard" className="flex items-center gap-2 font-headline font-semibold">
                    <Logo width={40} height={40} />
                    <span className="whitespace-nowrap">Ezi Languages</span>
                </Link>
             )}
             <Button 
                variant="ghost" 
                size="icon"
                className={cn(!isSidebarCollapsed && "ml-auto")}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-6 w-6" />}
             </Button>
          </div>
          <div className="flex-1">
            <MainNav isCollapsed={isSidebarCollapsed} userRole={userProfile?.role} />
          </div>
        </div>
      </div>
      <div className="flex flex-col max-h-screen overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 shrink-0 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetHeader>
                 <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo width={40} height={40} />
                  <span>Ezi Languages</span>
                </Link>
                <MainNav isMobile userRole={userProfile?.role}/>
              </nav>
            </SheetContent>
          </Sheet>

          {isSidebarCollapsed && (
             <div className="hidden md:block">
                <Link href="/dashboard" className="flex items-center gap-2 font-headline font-semibold">
                    <Logo width={40} height={40} />
                    <span className="whitespace-nowrap">Ezi Languages</span>
                </Link>
             </div>
          )}

          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <ThemeSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName ?? ""} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName ?? 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userProfile?.role === 'student' && (
                <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {(userProfile?.role === 'admin' || userProfile?.role === 'teacher' || userProfile?.role === 'superadmin') && (
                  <>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/teacher">
                            <School className="mr-2 h-4 w-4" />
                            <span>Teacher</span>
                        </Link>
                    </DropdownMenuItem>
                  </>
              )}
              {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
                  <>
                     <DropdownMenuItem asChild>
                        <Link href="/admin">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Admin</span>
                        </Link>
                    </DropdownMenuItem>
                  </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut}>
                 <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
            <div className="p-4 lg:p-6">
              {!user.emailVerified && !user.email?.endsWith('@ezilanguages.com') && (
                  <Alert variant="default" className="bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 mb-4">
                      <AlertTitle className="font-bold">Verification Required</AlertTitle>
                      <AlertDescription>
                          Your email is not verified. Please check your inbox for a verification link to unlock all features.
                      </AlertDescription>
                  </Alert>
              )}
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
    </ScrollContext.Provider>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
