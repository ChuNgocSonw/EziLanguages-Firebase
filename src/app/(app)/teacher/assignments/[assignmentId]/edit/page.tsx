
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AssignmentForm from "@/components/assignment-form";
import { useAuth } from "@/hooks/use-auth";
import type { Assignment } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function EditAssignmentPage() {
    const { assignmentId } = useParams();
    const { getAssignmentDetails } = useAuth();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof assignmentId !== 'string') return;
        
        const fetchAssignment = async () => {
            setIsLoading(true);
            try {
                const data = await getAssignmentDetails(assignmentId);
                if (data) {
                    setAssignment(data);
                } else {
                    // Handle not found case, maybe redirect
                }
            } catch (error) {
                console.error("Failed to fetch assignment details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId, getAssignmentDetails]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Loading assignment...</p>
            </div>
        );
    }

    if (!assignment) {
        return <div>Assignment not found.</div>;
    }

    return <AssignmentForm existingAssignment={assignment} />;
}
