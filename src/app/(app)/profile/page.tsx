
"use client";

import { useEffect, useState, useRef } from "react";
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
import { Loader2, CalendarIcon, Camera } from "lucide-react";
import { badgeCategories } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, updateUserAppData, updateUserProfilePicture } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      dob: undefined,
      language: "EN",
    },
  });
  
  const dobValue = form.watch("dob");
  const [month, setMonth] = useState<Date | undefined>(dobValue);

  useEffect(() => {
    setMonth(dobValue);
  }, [dobValue]);


  useEffect(() => {
    if (userProfile) {
      let dobDate: Date | undefined = undefined;
      if (userProfile.dob) {
        if (userProfile.dob instanceof Timestamp) {
          dobDate = userProfile.dob.toDate();
        } else {
          dobDate = userProfile.dob as Date;
        }
      }

      form.reset({
        name: userProfile.name || user?.displayName || "",
        dob: dobDate,
        language: "EN",
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
        dob: data.dob,
        language: "EN",
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "admin":
        return "destructive";
      case "teacher":
        return "secondary";
      default:
        return "default";
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await updateUserProfilePicture(file);
        toast({
          title: "Avatar Updated",
          description: "Your new profile picture has been saved.",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
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
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-primary/20">
                                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                                <AvatarFallback className="text-3xl">
                                    {getInitials(user?.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-8 w-8 text-white" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                            />
                        </div>
                        <div className="text-center">
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your display name and date of birth.</CardDescription>
                        </div>
                    </div>
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
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                month={month}
                                onMonthChange={setMonth}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={new Date().getFullYear()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <Input value={user?.email || ""} disabled />
                    </div>
                     <div className="space-y-2">
                        <FormLabel>Role</FormLabel>
                        <div>
                           {userProfile?.role && (
                             <Badge variant={getRoleBadgeVariant(userProfile.role)} className="capitalize">
                               {userProfile.role === 'superadmin' ? 'Super Admin' : userProfile.role}
                             </Badge>
                           )}
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
