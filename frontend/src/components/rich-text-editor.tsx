'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    ALargeSmall,
    type LucideIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useEffect, useState } from 'react';

interface ToolbarItem {
    icon: LucideIcon;
    label: string;
    action: (e: Editor) => void;
    isActive: (e: Editor) => boolean;
}

// Always visible on all viewports
const ESSENTIAL_TOOLBAR: ToolbarItem[][] = [
    [
        { icon: Bold, label: 'Bold', action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold') },
        { icon: Italic, label: 'Italic', action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic') },
        { icon: UnderlineIcon, label: 'Underline', action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline') },
    ],
    [
        { icon: List, label: 'Bullet list', action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
        { icon: ListOrdered, label: 'Numbered list', action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
    ],
];

// Hidden on mobile, shown inline on md+
const EXTENDED_TOOLBAR: ToolbarItem[][] = [
    [
        { icon: Strikethrough, label: 'Strikethrough', action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive('strike') },
    ],
    [
        { icon: Heading1, label: 'Heading 1', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
        { icon: Heading2, label: 'Heading 2', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
        { icon: Heading3, label: 'Heading 3', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) },
    ],
    [
        { icon: Quote, label: 'Blockquote', action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
        { icon: Code, label: 'Code block', action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive('codeBlock') },
    ],
];

const FORMAT_PICKER_ITEMS: ToolbarItem[] = EXTENDED_TOOLBAR.flat();

function ToolbarGroup({ items, editor }: { items: ToolbarItem[]; editor: Editor }) {
    return (
        <div className="flex items-center gap-1" role="group">
            {items.map((item, i) => {
                const Icon = item.icon;
                return (
                    <Toggle
                        key={i}
                        size="sm"
                        className="h-5 w-5 min-w-0 p-0 rounded-sm text-muted-foreground"
                        pressed={item.isActive(editor)}
                        onPressedChange={() => item.action(editor)}
                        aria-label={item.label}
                    >
                        <Icon className="h-3 w-3" />
                    </Toggle>
                );
            })}
        </div>
    );
}

function FormatPicker({ editor }: { editor: Editor }) {
    const [open, setOpen] = useState(false);

    const hasActiveFormat = FORMAT_PICKER_ITEMS.some((item) => item.isActive(editor));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Toggle
                    size="sm"
                    className="h-5 w-5 min-w-0 p-0 rounded-sm text-muted-foreground"
                    pressed={hasActiveFormat}
                    aria-label="More formatting options"
                >
                    <ALargeSmall className="h-3 w-3" />
                </Toggle>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-1"
                align="center"
                side="bottom"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex items-center gap-1">
                    {EXTENDED_TOOLBAR.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-1">
                            {gi > 0 && <div className="w-px h-3 bg-border mx-1" />}
                            <ToolbarGroup items={group} editor={editor} />
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const RichTextEditor = ({
    value,
    onChange,
    placeholder,
    disabled,
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editable: !disabled,
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="overflow-hidden" data-testid="rich-text-editor">
            <div
                className="flex items-center gap-1 px-1 py-1 border-b"
                role="toolbar"
                aria-label="Text formatting"
                onMouseDown={(e) => e.preventDefault()}
            >
                {/* Essential items - always visible */}
                {ESSENTIAL_TOOLBAR.map((group, gi) => (
                    <div key={gi} className="flex items-center gap-1">
                        {gi > 0 && <div className="w-px h-3 bg-border mx-1" />}
                        <ToolbarGroup items={group} editor={editor} />
                    </div>
                ))}

                {/* Mobile: "Aa" format picker popover */}
                <div className="md:hidden flex items-center gap-1">
                    <div className="w-px h-3 bg-border mx-1" />
                    <FormatPicker editor={editor} />
                </div>

                {/* Tablet+: extended items inline */}
                {EXTENDED_TOOLBAR.map((group, gi) => (
                    <div key={`ext-${gi}`} className="hidden md:flex items-center gap-1">
                        <div className="w-px h-3 bg-border mx-1" />
                        <ToolbarGroup items={group} editor={editor} />
                    </div>
                ))}
            </div>
            <EditorContent
                editor={editor}
                className="prose prose-invert max-w-none p-3 min-h-[150px] [&_.ProseMirror]:outline-none [&_.ProseMirror:focus]:outline-none"
            />
        </div>
    );
};
