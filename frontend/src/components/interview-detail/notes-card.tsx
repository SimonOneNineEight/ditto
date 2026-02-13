'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { InterviewDetailCard } from './interview-detail-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const RichTextEditor = dynamic(
    () =>
        import('@/components/rich-text-editor').then((mod) => ({
            default: mod.RichTextEditor,
        })),
    {
        loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />,
        ssr: false,
    }
);
import { AutoSaveIndicator } from '@/components/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
    InterviewNote,
    NoteType,
    createOrUpdateNote,
} from '@/services/interview-service';
import { sanitizeHtml } from '@/lib/sanitizer';

type TabType = 'preparation' | 'during' | 'reflection';

const TABS: { id: TabType; label: string; noteType: NoteType }[] = [
    { id: 'preparation', label: 'Preparation', noteType: 'preparation' },
    { id: 'during', label: 'During Interview', noteType: 'feedback' },
    { id: 'reflection', label: 'Reflection', noteType: 'reflection' },
];

interface NotesCardProps {
    notes: InterviewNote[];
    interviewId: string;
    onUpdate: () => void;
}

export const NotesCard = ({
    notes,
    interviewId,
    onUpdate,
}: NotesCardProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('preparation');
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState<string>('');
    const activeTabRef = useRef<TabType>('preparation');

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    const getCurrentNoteType = (): NoteType => {
        return TABS.find((t) => t.id === activeTab)?.noteType || 'preparation';
    };

    const getNoteContent = (noteType: NoteType): string => {
        const note = notes.find((n) => n.note_type === noteType);
        return note?.content || '';
    };

    const saveNote = useCallback(
        async (content: string) => {
            const noteType =
                TABS.find((t) => t.id === activeTabRef.current)?.noteType ||
                'preparation';
            await createOrUpdateNote(interviewId, {
                note_type: noteType,
                content,
            });
            onUpdate();
        },
        [interviewId, onUpdate]
    );

    const { status, lastSaved, retry } = useAutoSave(editingContent, saveNote, {
        enabled: isEditing,
    });

    const startEditing = () => {
        const noteType = getCurrentNoteType();
        const content = getNoteContent(noteType);
        setEditingContent(content);
        setIsEditing(true);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setIsEditing(false);
        setEditingContent('');
    };

    const handleContentChange = (content: string) => {
        setEditingContent(content);
    };

    const currentNoteType = getCurrentNoteType();
    const currentContent = isEditing
        ? editingContent
        : getNoteContent(currentNoteType);
    const isEmpty = !currentContent || currentContent === '<p></p>';

    return (
        <InterviewDetailCard title="Notes">
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 border-b border-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium transition-colors relative',
                                activeTab === tab.id
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Auto-save indicator */}
                {isEditing && (
                    <div className="flex justify-end">
                        <AutoSaveIndicator
                            status={status}
                            lastSaved={lastSaved}
                            onRetry={retry}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="min-h-[120px]">
                    {isEditing ? (
                        <RichTextEditor
                            value={editingContent}
                            onChange={handleContentChange}
                            placeholder={`Add ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} notes...`}
                        />
                    ) : isEmpty ? (
                        <div
                            className="text-sm text-muted-foreground cursor-pointer p-3 rounded-md border border-dashed border-border hover:border-muted-foreground transition-colors"
                            onClick={startEditing}
                        >
                            Click to add{' '}
                            {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}{' '}
                            notes...
                        </div>
                    ) : (
                        <div
                            className="prose prose-invert max-w-none text-sm cursor-pointer"
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(currentContent),
                            }}
                            onClick={startEditing}
                        />
                    )}
                </div>
            </div>
        </InterviewDetailCard>
    );
};
