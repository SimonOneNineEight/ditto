'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useClickOutside } from '@/hooks/use-click-outside';
import dynamic from 'next/dynamic';

import { InterviewDetailCard } from './interview-detail-card';
import { Button } from '@/components/ui/button';
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

const TABS: { id: TabType; label: string; shortLabel?: string; noteType: NoteType }[] = [
    { id: 'preparation', label: 'Preparation', noteType: 'preparation' },
    { id: 'during', label: 'During Interview', shortLabel: 'During', noteType: 'feedback' },
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
    const flushRef = useRef<(() => void) | null>(null);
    const closeEditor = useCallback(() => {
        flushRef.current?.();
        setIsEditing(false);
    }, []);
    const editorWrapperRef = useClickOutside<HTMLDivElement>(closeEditor, isEditing);

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

    const { status, lastSaved, retry, flush } = useAutoSave(editingContent, saveNote, {
        enabled: isEditing,
    });
    flushRef.current = flush;

    const startEditing = () => {
        const noteType = getCurrentNoteType();
        const content = getNoteContent(noteType);
        setEditingContent(content);
        setIsEditing(true);
    };

    const handleTabChange = (tab: TabType) => {
        if (isEditing) {
            flush();
        }
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

    const headerAction = isEditing ? (
        <AutoSaveIndicator
            status={status}
            lastSaved={lastSaved}
            onRetry={retry}
        />
    ) : undefined;

    return (
        <InterviewDetailCard title="Notes" headerAction={headerAction}>
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Note categories">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-sm',
                                activeTab === tab.id
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {tab.shortLabel ? (
                                <>
                                    <span className="sm:hidden">{tab.shortLabel}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </>
                            ) : tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[230px]">
                    {isEditing ? (
                        <div ref={editorWrapperRef} className="space-y-2">
                            <RichTextEditor
                                value={editingContent}
                                onChange={handleContentChange}
                                placeholder={`Add ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} notes...`}
                            />
                            <div className="flex justify-end">
                                <Button
                                    variant="ghost-primary"
                                    size="sm"
                                    onClick={closeEditor}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    ) : isEmpty ? (
                        <div
                            className="text-sm text-muted-foreground cursor-pointer py-1 hover:text-foreground transition-colors"
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
