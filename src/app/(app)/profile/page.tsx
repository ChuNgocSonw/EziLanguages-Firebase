"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { profileSchema, ProfileFormData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allBadges, Badge } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, updateUserAppData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 0,
      language: "EN",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || user?.displayName || "",
        age: userProfile.age || 0,
        language: userProfile.language as "EN" | "JP" | "KR" | "VI" || "EN",
      });

      const userBadges = allBadges.filter(badge => userProfile.badges?.includes(badge.id));
      setEarnedBadges(userBadges);
    }
  }, [userProfile, user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      if (data.name !== user?.displayName) {
        await updateUserProfile(data.name);
      }
      
      await updateUserAppData({
        age: data.age,
        language: data.language,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Your Profile"
        description="Manage your account settings and personal information."
      />
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your display name, age, and learning language.</CardDescription>
                </CardHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Your age" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Learning Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="EN">English</SelectItem>
                                    <SelectItem value="JP">Japanese</SelectItem>
                                    <SelectItem value="KR">Korean</SelectItem>
                                    <SelectItem value="VI">Vietnamese</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <Input value={user?.email || ""} disabled />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Badges</CardTitle>
                    <CardDescription>Achievements you've unlocked on your learning journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    {earnedBadges.length > 0 ? (
                        <TooltipProvider>
                            <div className="flex flex-wrap gap-4">
                                {earnedBadges.map(badge => {
                                    const Icon = badge.icon;
                                    return (
                                        <Tooltip key={badge.id}>
                                            <TooltipTrigger>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-muted rounded-full border-2 border-primary/20">
                                                        <Icon className="h-8 w-8 text-primary" />
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-bold">{badge.name}</p>
                                                <p className="text-sm text-muted-foreground">{badge.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </TooltipProvider>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You haven't earned any badges yet.</p>
                            <p>Keep learning to unlock them!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
