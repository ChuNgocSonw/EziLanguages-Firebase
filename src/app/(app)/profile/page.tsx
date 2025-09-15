
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
import { badgeCategories } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, updateUserAppData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 0,
      language: "EN",
      streak: 0,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || user?.displayName || "",
        age: userProfile.age || 0,
        language: userProfile.language as "EN" | "JP" | "KR" | "VI" || "EN",
        streak: userProfile.streak || 0,
      });
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
        streak: data.streak,
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
                        name="streak"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Daily Streak (Test)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Your streak" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
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
                    <CardDescription>Achievements to unlock on your learning journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <div className="space-y-6">
                            {badgeCategories.map(category => (
                                <div key={category.name}>
                                    <h3 className="font-semibold mb-2">{category.name} Badges</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {category.badges.map(badge => {
                                            const Icon = badge.icon;
                                            const isEarned = userProfile?.badges?.includes(badge.id);
                                            return (
                                                <Tooltip key={badge.id}>
                                                    <TooltipTrigger>
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className={cn(
                                                                "p-3 bg-muted rounded-full border-2 transition-all",
                                                                isEarned ? {
                                                                    "border-primary/50": category.name === "Easy",
                                                                    "border-yellow-500/50": category.name === "Medium",
                                                                    "border-destructive/50": category.name === "Hard",
                                                                } : "border-transparent opacity-40 grayscale"
                                                            )}>
                                                                <Icon className={cn(
                                                                    "h-8 w-8",
                                                                    isEarned ? {
                                                                        "text-primary": category.name === "Easy",
                                                                        "text-yellow-500": category.name === "Medium",
                                                                        "text-destructive": category.name === "Hard",
                                                                    } : "text-muted-foreground"
                                                                )} />
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
                                    {category.name !== "Hard" && <Separator className="mt-6" />}
                                </div>
                            ))}
                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>
        </div>
    </>
  );
}
