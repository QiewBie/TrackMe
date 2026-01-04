import * as React from 'react';
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, RemoveFormatting } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
    unstyled?: boolean;
}

const MenuButton = ({
    active,
    onClick,
    children,
    disabled = false
}: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded hover:bg-bg-subtle transition-colors
            ${active ? 'text-brand-primary bg-brand-subtle' : 'text-text-secondary'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        {children}
    </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder,
    editable = true,
    className = '',
    unstyled = false
}) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder || t('editor.placeholder');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: resolvedPlaceholder,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }: { editor: any }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-text-primary'
            }
        }
    });

    // Sync content updates from parent (fixes Project switching leak)
    // Sync content updates from parent (fixes Project switching leak)
    // Removed complicated sync logic as we now use key={} in parent to force re-mount.
    // This is safer and prevents data leaks.
    // Sync content updates from parent (Initial Load from Firestore)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if we are not focused (avoids cursor jump while typing)
            // OR if the content is drastically different (e.g. just loaded from DB)
            if (!editor.isFocused || Math.abs(content.length - editor.getHTML().length) > 10) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const containerClass = unstyled
        ? `relative flex flex-col ${className} rich-text-editor`
        : `border border-border rounded-xl overflow-hidden bg-bg-surface shadow-sm relative flex flex-col ${className} rich-text-editor`;

    return (
        <div className={containerClass}>

            {editable && (
                <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-bg-subtle shrink-0">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                    >
                        <Bold size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                    >
                        <Italic size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                    >
                        <Heading1 size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                    >
                        <Heading2 size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                    >
                        <List size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                    >
                        <ListOrdered size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                    >
                        <Quote size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <MenuButton
                        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                        disabled={!editor.isFocused}
                    >
                        <RemoveFormatting size={18} />
                    </MenuButton>
                </div>
            )}
            <EditorContent editor={editor} className="flex-1 h-full [&>.ProseMirror]:h-full [&>.ProseMirror]:min-h-full" />
        </div>
    );
};

export default RichTextEditor;
