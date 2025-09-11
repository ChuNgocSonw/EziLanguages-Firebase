import Link from "next/link";
import { Logo } from "@/components/icons";
import { AuthProvider } from "@/context/auth-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
              <Link href="/dashboard" className="flex items-center gap-2 font-headline font-semibold text-2xl">
                <Logo className="h-8 w-8 text-primary" />
                <span>Ezi Languages</span>
              </Link>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
