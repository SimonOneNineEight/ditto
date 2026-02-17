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
    type LucideIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useState, useEffect } from 'react';

interface ToolbarItem {
    icon: LucideIcon;
    action: (e: Editor) => void;
    isActive: (e: Editor) => boolean;
}

const TOOLBAR: ToolbarItem[][] = [
    [
        { icon: Bold, action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold') },
        { icon: Italic, action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic') },
        { icon: UnderlineIcon, action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline') },
        { icon: Strikethrough, action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive('strike') },
    ],
    [
        { icon: Heading1, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
        { icon: Heading2, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
        { icon: Heading3, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) },
    ],
    [
        { icon: List, action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
        { icon: ListOrdered, action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
    ],
    [
        { icon: Quote, action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
        { icon: Code, action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive('codeBlock') },
    ],
];

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
    const [, forceRender] = useState(0);

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
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
            forceRender((t) => t + 1);
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
        <div className="overflow-hidden">
            <div
                className="flex items-center gap-1 px-1 py-1 border-b"
                onMouseDown={(e) => e.preventDefault()}
            >
                {TOOLBAR.map((group, gi) => (
                    <div key={gi} className="flex items-center gap-1">
                        {gi > 0 && <div className="w-px h-3 bg-border mx-1" />}
                        {group.map((item, ii) => {
                            const Icon = item.icon;
                            return (
                                <Toggle
                                    key={ii}
                                    size="sm"
                                    className="h-5 w-5 min-w-0 p-0 rounded-sm text-muted-foreground"
                                    pressed={item.isActive(editor)}
                                    onPressedChange={() => {
                                        item.action(editor);
                                        forceRender((t) => t + 1);
                                    }}
                                >
                                    <Icon className="h-3 w-3" />
                                </Toggle>
                            );
                        })}
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
