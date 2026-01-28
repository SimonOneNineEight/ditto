'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { CollapsibleSection } from './collapsible-section';
import { AddInterviewerForm } from './add-interviewer-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
    Interviewer,
    updateInterviewer,
    deleteInterviewer,
} from '@/services/interview-service';

interface InterviewersSectionProps {
    interviewers: Interviewer[];
    interviewId: string;
    onUpdate: () => void;
}

interface EditingState {
    id: string;
    name: string;
    role: string;
}

export const InterviewersSection = ({
    interviewers,
    interviewId,
    onUpdate,
}: InterviewersSectionProps) => {
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Interviewer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isEmpty = interviewers.length === 0;

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

    return (
        <>
            <CollapsibleSection
                title="Interviewers"
                isEmpty={isEmpty}
                onAdd={handleAddInterviewer}
                emptyState={{
                    message: 'No interviewers added yet',
                    actionLabel: 'Add Interviewer',
                    onAction: handleAddInterviewer,
                }}
            >
                <div className="space-y-3">
                    {interviewers.map((interviewer) => (
                        <div
                            key={interviewer.id}
                            className="flex items-center gap-2 py-1.5 group"
                        >
                            {editing?.id === interviewer.id ? (
                                // Edit mode
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
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                            onClick={saveEditing}
                                            disabled={isSaving}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={cancelEditing}
                                            disabled={isSaving}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Display mode
                                <>
                                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                                        <span className="text-sm">
                                            {interviewer.name}
                                        </span>
                                        {interviewer.role && (
                                            <>
                                                <span className="text-sm text-muted-foreground">
                                                    -
                                                </span>
                                                <span className="text-sm text-muted-foreground truncate">
                                                    {interviewer.role}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => startEditing(interviewer)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeleteTarget(interviewer)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <AddInterviewerForm
                interviewId={interviewId}
                open={isAddFormOpen}
                onOpenChange={setIsAddFormOpen}
                onSuccess={handleAddSuccess}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Interviewer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {deleteTarget?.name}? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
