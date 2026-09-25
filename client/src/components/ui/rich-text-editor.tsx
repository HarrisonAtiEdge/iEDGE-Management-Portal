import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { normalizeDescriptionToHtml } from "@/lib/richText";

// Tiptap's useEditor() compares this extensions array (and editorProps) by
// reference on every render, and rebuilds the entire schema/extension
// manager whenever the reference changes. Module-level constants keep the
// reference stable across renders and across every row's editor instance —
// inline object/array literals here would make every keystroke trigger a
// full schema rebuild, which is what was making typing/clicking feel slow.
const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    code: false,
    link: false,
  }),
];

const EDITOR_PROPS = {
  attributes: {
    class: "prose-sm max-w-none focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0",
  },
};

/**
 * The inactive preview can't use dangerouslySetInnerHTML — that would trust
 * whatever HTML happens to be stored (e.g. a doc edited directly, not just
 * through this editor) verbatim, including event-handler attributes like
 * onerror/onload, which the browser does execute. The active Tiptap editor
 * is safe from this because it parses content through its own schema, which
 * only knows about the handful of tags below and silently drops everything
 * else — attributes included. This mirrors that: only structural tags are
 * read, text is rendered as plain text (React escapes it), and no attribute
 * from the source HTML is ever forwarded.
 */
function renderSafeDescriptionHtml(html: string): ReactNode {
  if (!html || !html.trim()) return null;

  // DOMParser produces an inert document — unlike setting .innerHTML on a
  // real element, it never loads images or fires event-handler attributes,
  // even while we're just reading the parsed structure below.
  const container = new DOMParser().parseFromString(html, "text/html").body;

  let key = 0;

  const renderInline = (node: ParentNode): ReactNode[] => {
    const out: ReactNode[] = [];

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) out.push(<Fragment key={key++}>{child.textContent}</Fragment>);
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "br") {
        out.push(<br key={key++} />);
        return;
      }

      const inner = renderInline(el);

      if (tag === "strong" || tag === "b") {
        out.push(<strong key={key++}>{inner}</strong>);
      } else if (tag === "em" || tag === "i") {
        out.push(<em key={key++}>{inner}</em>);
      } else if (tag === "u") {
        out.push(<u key={key++}>{inner}</u>);
      } else {
        out.push(<Fragment key={key++}>{inner}</Fragment>);
      }
    });

    return out;
  };

  const blocks: ReactNode[] = [];

  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push(<p key={key++}>{node.textContent}</p>);
      }
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "ul" || tag === "ol") {
      const ListTag = tag as "ul" | "ol";
      const items: ReactNode[] = [];
      el.querySelectorAll(":scope > li").forEach((li) => {
        items.push(<li key={key++}>{renderInline(li)}</li>);
      });
      blocks.push(<ListTag key={key++}>{items}</ListTag>);
      return;
    }

    blocks.push(<p key={key++}>{renderInline(el)}</p>);
  });

  return blocks;
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  "data-testid"?: string;
};

/**
 * A form with many of these rows (an estimate/invoice with 30-50 service
 * lines) was measurably slow to become interactive: each row builds a full
 * Tiptap/ProseMirror editor instance up front, and that cost scales with row
 * count (~75ms for 50 rows vs ~20ms for 50 plain textareas, benchmarked) —
 * on a phone that's worse, and it's exactly the kind of work that can make a
 * click feel stuck while the rest of the table's editors are still building.
 * So a row starts as a cheap static preview (no Tiptap instance at all) and
 * only mounts the real editor — via RichTextEditorField below — the instant
 * it's clicked into, auto-focusing so the click still feels instant.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const [isActive, setIsActive] = useState(false);

  if (!isActive) {
    return <RichTextEditorPreview {...props} onActivate={() => setIsActive(true)} />;
  }

  return <RichTextEditorField {...props} />;
}

function RichTextEditorPreview({
  value,
  placeholder,
  minHeight = 96,
  className = "",
  "data-testid": dataTestId,
  onActivate,
}: RichTextEditorProps & { onActivate: () => void }) {
  const isEmpty = !value || !value.trim();

  return (
    <div
      role="textbox"
      tabIndex={0}
      onClick={onActivate}
      onFocus={onActivate}
      className={cn(
        "relative cursor-text rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-blue-500",
        className,
      )}
      style={{ minHeight }}
      data-testid={dataTestId}
    >
      {isEmpty ? (
        <span className="text-gray-400">{placeholder}</span>
      ) : (
        <div className="prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0">
          {renderSafeDescriptionHtml(normalizeDescriptionToHtml(value))}
        </div>
      )}
    </div>
  );
}

function RichTextEditorField({
  value,
  onChange,
  placeholder = "",
  minHeight = 96,
  className = "",
  "data-testid": dataTestId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: normalizeDescriptionToHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: EDITOR_PROPS,
  });

  // This instance is only ever mounted by clicking/focusing the preview
  // above, so pick up where that click left off instead of requiring a
  // second click.
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!editor || hasAutoFocused.current) return;
    hasAutoFocused.current = true;
    editor.commands.focus("end");
  }, [editor]);

  // Keep the editor in sync with external value changes (e.g. an autofill
  // from a picked service) without fighting the user's own typing/cursor
  // while they're focused in this instance.
  useEffect(() => {
    if (!editor) return;

    const normalized = normalizeDescriptionToHtml(value);
    if (editor.isFocused) return;
    if (normalized === editor.getHTML()) return;

    editor.commands.setContent(normalized, { emitUpdate: false });
  }, [value, editor]);

  const {
    isBoldActive,
    isItalicActive,
    isUnderlineActive,
    isBulletListActive,
    isOrderedListActive,
    isEmpty,
  } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBoldActive: editor?.isActive("bold") ?? false,
      isItalicActive: editor?.isActive("italic") ?? false,
      isUnderlineActive: editor?.isActive("underline") ?? false,
      isBulletListActive: editor?.isActive("bulletList") ?? false,
      isOrderedListActive: editor?.isActive("orderedList") ?? false,
      isEmpty: editor?.isEmpty ?? true,
    }),
  });

  const toolbarButtons = editor
    ? [
        {
          key: "bold",
          title: "Bold",
          icon: BoldIcon,
          active: isBoldActive,
          onClick: () => editor.chain().focus().toggleBold().run(),
        },
        {
          key: "italic",
          title: "Italic",
          icon: ItalicIcon,
          active: isItalicActive,
          onClick: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          key: "underline",
          title: "Underline",
          icon: UnderlineIcon,
          active: isUnderlineActive,
          onClick: () => editor.chain().focus().toggleUnderline().run(),
        },
        {
          key: "bulletList",
          title: "Bullet list",
          icon: ListIcon,
          active: isBulletListActive,
          onClick: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          key: "orderedList",
          title: "Numbered list",
          icon: ListOrderedIcon,
          active: isOrderedListActive,
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "relative rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500",
        className,
      )}
      style={{ minHeight }}
      data-testid={dataTestId}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-md"
        >
          {toolbarButtons.map(({ key, title, icon: Icon, active, onClick }) => (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClick}
              className={cn("rounded p-1.5 hover:bg-gray-100", active && "bg-gray-200")}
              title={title}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="text-sm" />

      {isEmpty && placeholder && (
        <div className="pointer-events-none absolute left-2 top-1.5 text-sm text-gray-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}
