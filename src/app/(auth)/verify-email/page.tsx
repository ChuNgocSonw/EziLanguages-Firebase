
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, KeyRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import React from "react";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 characters.").max(6, "OTP must be 6 characters."),
});

type OtpFormData = z.infer<typeof otpSchema>;

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  // Placeholder function for OTP submission
  const onSubmit = (data: OtpFormData) => {
    console.log("OTP Submitted:", data.otp);
    setIsLoading(true);
    // Here you would typically call a function to verify the OTP
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Check Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to your email address. Please enter it below to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="_ _ _ _ _ _" 
                      {...field} 
                      className="text-center text-2xl tracking-[1rem] font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Account
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-muted-foreground">
            <p>
                Didn't receive a code?{" "}
                <Button variant="link" className="p-0 h-auto">
                    Resend code
                </Button>
            </p>
             <p>
                <Link href="/login" className="underline font-semibold text-primary">
                    Back to Login
                </Link>
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
