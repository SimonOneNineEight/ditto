'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { InterviewDetailCard } from './interview-detail-card';
import { AddInterviewerForm } from './add-interviewer-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

import {
    Interviewer,
    updateInterviewer,
    deleteInterviewer,
} from '@/services/interview-service';

interface InterviewersCardProps {
    interviewers: Interviewer[];
    interviewId: string;
    onUpdate: () => void;
}

interface EditingState {
    id: string;
    name: string;
    role: string;
}

export const InterviewersCard = ({
    interviewers,
    interviewId,
    onUpdate,
}: InterviewersCardProps) => {
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Interviewer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddInterviewer = () => {
        setIsAddFormOpen(true);
    };

    const handleAddSuccess = () => {
        onUpdate();
    };

    const startEditing = (interviewer: Interviewer) => {
        setEditing({
            id: interviewer.id,
            name: interviewer.name,
            role: interviewer.role || '',
        });
    };

    const cancelEditing = () => {
        setEditing(null);
    };

    const saveEditing = async () => {
        if (!editing) return;

        if (!editing.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSaving(true);
        try {
            await updateInterviewer(editing.id, {
                name: editing.name.trim(),
                role: editing.role.trim() || undefined,
            });
            toast.success('Interviewer updated successfully');
            setEditing(null);
            onUpdate();
        } catch {
            toast.error('Failed to update interviewer');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteInterviewer(deleteTarget.id);
            toast.success('Interviewer deleted successfully');
            setDeleteTarget(null);
            onUpdate();
        } catch {
            toast.error('Failed to delete interviewer');
        } finally {
            setIsDeleting(false);
        }
    };

    const headerAction = (
        <Button variant="ghost-primary" size="sm" onClick={handleAddInterviewer}>
            + Add Interviewer
        </Button>
    );

    return (
        <>
            <InterviewDetailCard title="Interviewers" headerAction={headerAction}>
                {interviewers.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                        No interviewers added yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interviewers.map((interviewer) => (
                            <div
                                key={interviewer.id}
                                className="flex items-center gap-3 group"
                            >
                                {editing?.id === interviewer.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={editing.name}
                                                onChange={(e) =>
                                                    setEditing({
                                                        ...editing,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Name"
                                                className="h-8"
                                                disabled={isSaving}
                                                autoFocus
                                            />
                                            <Input
                                                value={editing.role}
                                                onChange={(e) =>
                                                    setEditing({
                                                        ...editing,
                                                        role: e.target.value,
                                                    })
                                                }
                                                placeholder="Role (optional)"
                                                className="h-8"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Save changes"
                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                onClick={saveEditing}
                                                disabled={isSaving}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Cancel editing"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={cancelEditing}
                                                disabled={isSaving}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
                                            <span className="text-xs font-semibold text-primary-foreground">
                                                {interviewer.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">
                                                {interviewer.name}
                                            </div>
                                            {interviewer.role && (
                                                <div className="text-xs text-muted-foreground">
                                                    {interviewer.role}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Edit ${interviewer.name}`}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() =>
                                                    startEditing(interviewer)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete ${interviewer.name}`}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    setDeleteTarget(interviewer)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </InterviewDetailCard>

            <AddInterviewerForm
                interviewId={interviewId}
                open={isAddFormOpen}
                onOpenChange={setIsAddFormOpen}
                onSuccess={handleAddSuccess}
            />

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Interviewer"
                description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
                isDeleting={isDeleting}
                destructive
            />
        </>
    );
};
