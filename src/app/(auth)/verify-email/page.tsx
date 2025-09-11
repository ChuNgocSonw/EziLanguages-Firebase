import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <MailCheck className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to your email address. Please check your inbox and follow the link to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
         <p className="text-sm text-muted-foreground">
            Finished verifying?{" "}
            <Link href="/login" className="underline font-semibold text-primary">
                Log in now
            </Link>
        </p>
      </CardContent>
    </Card>
  );
}
