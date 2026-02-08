'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import { CollapsibleSection } from './collapsible-section';
import { RichTextEditor } from '@/components/rich-text-editor';
import { AutoSaveIndicator } from '@/components/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
    InterviewNote,
    NoteType,
    createOrUpdateNote,
} from '@/services/interview-service';
import { sanitizeHtml } from '@/lib/sanitizer';

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
    preparation: 'Preparation',
    company_research: 'Company Research',
    feedback: 'Feedback',
    reflection: 'Reflection',
    general: 'General',
};

const NOTE_TYPES: NoteType[] = [
    'preparation',
    'company_research',
    'feedback',
    'reflection',
    'general',
];

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
    const editingTypeRef = useRef<NoteType | null>(null);

    useEffect(() => {
        editingTypeRef.current = editingType;
    }, [editingType]);

    const getNoteContent = (type: NoteType): string => {
        const note = notes.find((n) => n.note_type === type);
        return note?.content || '';
    };

    const saveNote = useCallback(async (content: string) => {
        const noteType = editingTypeRef.current;
        if (!noteType) return;

        await createOrUpdateNote(interviewId, {
            note_type: noteType,
            content,
        });
        onUpdate();
    }, [interviewId, onUpdate]);

    const { status, lastSaved, retry } = useAutoSave(
        editingContent,
        saveNote,
        { enabled: !!editingType }
    );

    const startEditing = (type: NoteType) => {
        const content = getNoteContent(type);
        setEditingType(type);
        setEditingContent(content);
    };

    const handleContentChange = (content: string) => {
        setEditingContent(content);
    };

    return (
        <div className="space-y-2">
            {NOTE_TYPES.map((type) => {
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
                                <AutoSaveIndicator
                                    status={status}
                                    lastSaved={lastSaved}
                                    onRetry={retry}
                                />
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
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                                onClick={() => startEditing(type)}
                            />
                        )}
                    </CollapsibleSection>
                );
            })}
        </div>
    );
};
