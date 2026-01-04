"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, X, Link as LinkIcon, RemoveFormatting, AtSign } from 'lucide-react';
import { useEffect, forwardRef, useImperativeHandle } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export interface RichTextEditorRef {
    insertContent: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Bold"
            >
                <Bold size={14} strokeWidth={2.5} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Italic"
            >
                <Italic size={14} strokeWidth={2.5} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('underline') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Underline"
            >
                <UnderlineIcon size={14} strokeWidth={2.5} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Bullet List"
            >
                <List size={14} strokeWidth={2.5} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Ordered List"
            >
                <ListOrdered size={14} strokeWidth={2.5} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                title="Quote"
            >
                <Quote size={14} strokeWidth={2.5} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().run()}
                className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
                title="Clear Formatting"
            >
                <RemoveFormatting size={14} strokeWidth={2.5} />
            </button>
        </div>
    );
};

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ value, onChange, placeholder = "Write something...", className = "", minHeight = "150px" }, ref) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-sm prose-slate focus:outline-none max-w-none px-4 py-3 text-slate-700 text-sm leading-relaxed',
                style: `min-height: ${minHeight}`,
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useImperativeHandle(ref, () => ({
        insertContent: (content: string) => {
            editor?.chain().focus().insertContent(content).run();
        }
    }));

    // Sync external value changes
    useEffect(() => {
        if (!editor) return;

        const currentContent = editor.getHTML();
        if (value === currentContent) return;

        // If editor is empty but we have a value, set it (Initial load)
        if (editor.isEmpty && value && value !== '<p></p>') {
            editor.commands.setContent(value);
            return;
        }

        // If we have an empty value but editor has content, clear it (Reset)
        if ((!value || value === '<p></p>') && !editor.isEmpty) {
            editor.commands.setContent('');
            return;
        }
    }, [value, editor]);

    return (
        <div className={`border border-slate-100 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all ${className}`}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
