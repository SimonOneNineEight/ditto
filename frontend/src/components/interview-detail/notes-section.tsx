'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import { CollapsibleSection } from './collapsible-section';
import { RichTextEditor } from '@/components/rich-text-editor';
import {
    InterviewNote,
    NoteType,
    createOrUpdateNote,
} from '@/services/interview-service';

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
    preparation: 'Preparation',
    company_research: 'Company Research',
    feedback: 'Feedback',
    reflection: 'Reflection',
    general: 'General',
};

const NOTE_TYPE: NoteType[] = [
    'preparation',
    'company_research',
    'feedback',
    'reflection',
    'general',
];

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface NoteSectionProps {
    notes: InterviewNote[];
    interviewId: string;
    onUpdate: () => void;
}

export const NoteSection = ({
    notes,
    interviewId,
    onUpdate,
}: NoteSectionProps) => {
    const [editingType, setEditingType] = useState<NoteType | null>(null);
    const [editingContent, setEditingContent] = useState<string>('');
    const [autoSaveStatus, setAutoSaveStatus] =
        useState<AutoSaveStatus>('idle');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<string>('');

    const getNoteContent = (type: NoteType): string => {
        const note = notes.find((n) => n.note_type === type);
        return note?.content || '';
    };

    const performAutoSave = useCallback(async () => {
        if (!editingType) return;

        if (lastSavedRef.current === editingContent) return;
        setAutoSaveStatus('saving');
        try {
            await createOrUpdateNote(interviewId, {
                note_type: editingType,
                content: editingContent,
            });
            lastSavedRef.current = editingContent;
            setAutoSaveStatus('saved');
            onUpdate();
        } catch {
            setAutoSaveStatus('error');
        }
    }, [editingContent, editingType, interviewId, onUpdate]);

    useEffect(() => {
        if (!editingType) {
            setAutoSaveStatus('idle');
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            performAutoSave();
        }, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [editingContent, editingType, performAutoSave]);

    const startEditing = (type: NoteType) => {
        const content = getNoteContent(type);
        setEditingType(type);
        setEditingContent(content);
        lastSavedRef.current = content;
        setAutoSaveStatus('idle');
    };

    const handleContentChange = (content: string) => {
        setEditingContent(content);
    };

    return (
        <div className="space-y-2">
            {NOTE_TYPE.map((type) => {
                const isEditing = editingType === type;
                const content = isEditing
                    ? editingContent
                    : getNoteContent(type);
                const isEmpty = !content || content === '<p></p>';

                return (
                    <CollapsibleSection
                        key={type}
                        title={NOTE_TYPE_LABELS[type]}
                        isEmpty={isEmpty}
                        defaultOpen={isEditing}
                        onAdd={() => startEditing(type)}
                    >
                        {isEditing && (
                            <div className="flex justify-end">
                                {autoSaveStatus === 'saving' && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving...
                                    </span>
                                )}

                                {autoSaveStatus === 'saved' && (
                                    <span className="text-xs text-green-600">
                                        Saved
                                    </span>
                                )}

                                {autoSaveStatus === 'error' && (
                                    <span className="text-xs text-red-600">
                                        error
                                    </span>
                                )}
                            </div>
                        )}

                        {isEditing ? (
                            <RichTextEditor
                                value={content}
                                onChange={handleContentChange}
                                placeholder={`Add ${NOTE_TYPE_LABELS[type].toLowerCase()} notes...`}
                            />
                        ) : (
                            <div
                                className="prose prose-invert max-w-none text-sm cursor-pointer"
                                dangerouslySetInnerHTML={{ __html: content }}
                                onClick={() => startEditing(type)}
                            />
                        )}
                    </CollapsibleSection>
                );
            })}
        </div>
    );
};
