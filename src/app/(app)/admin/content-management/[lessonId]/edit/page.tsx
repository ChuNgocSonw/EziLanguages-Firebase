
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CreateLessonForm from "@/components/create-lesson-form";
import { useAuth } from "@/hooks/use-auth";
import type { Lesson } from "@/lib/types";
import { Loader2, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function EditLessonPage() {
    const { lessonId } = useParams();
    const router = useRouter();
    const { getLessonDetails } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof lessonId !== 'string') return;
        
        const fetchLesson = async () => {
            setIsLoading(true);
            try {
                const data = await getLessonDetails(lessonId);
                if (data) {
                    setLesson(data);
                } else {
                    // Handle not found case
                    router.push("/admin/content-management");
                }
            } catch (error) {
                console.error("Failed to fetch lesson details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId, getLessonDetails, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Loading lesson for editing...</p>
            </div>
        );
    }

    if (!lesson) {
        return <div>Lesson not found.</div>;
    }

    return (
        <>
            <PageHeader
                title="Edit Lesson"
                description={`You are currently editing the lesson: "${lesson.unit}"`}
            />
            <div className="mb-4">
                <Button variant="outline" onClick={() => router.push('/admin/content-management')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Content Management
                </Button>
            </div>
            <CreateLessonForm 
                existingLesson={lesson} 
                onFinished={() => router.push('/admin/content-management')} 
            />
        </>
    );
}
