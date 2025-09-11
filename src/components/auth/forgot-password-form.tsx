"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      setEmailSent(true);
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (emailSent) {
    return (
        <Card>
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Mail className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Check Your Email</CardTitle>
                <CardDescription>
                We have sent a password reset link to the email address you provided. Please follow the instructions in the email to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                    Remembered your password?{" "}
                    <Link href="/login" className="underline font-semibold text-primary">
                        Log in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Forgot Password?</CardTitle>
        <CardDescription>
          No worries! Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Send Reset Link
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
