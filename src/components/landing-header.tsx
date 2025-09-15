import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './icons';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-headline font-semibold">
          <Logo />
          <span>Ezi Languages</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="text-foreground/80 hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="text-foreground/80 hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/signup">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
