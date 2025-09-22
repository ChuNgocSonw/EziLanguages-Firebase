import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './icons';
import { ThemeSwitcher } from './theme-switcher';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-headline font-semibold">
          <Logo />
          <span className="whitespace-nowrap">Ezi Languages</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button className="bg-accent hover:bg-accent/90" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
