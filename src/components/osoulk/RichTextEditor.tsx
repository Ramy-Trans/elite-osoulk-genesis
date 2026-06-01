import React, { useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Link2, Unlink2, Type,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
  dir?: "ltr" | "rtl";
  className?: string;
}

type ToolItem =
  | { kind: "btn"; icon: React.ReactNode; title: string; cmd: string; val?: string }
  | { kind: "sep" };

const TOOLBAR: ToolItem[] = [
  { kind: "btn", icon: <Bold className="h-3.5 w-3.5" />,          title: "Bold",            cmd: "bold" },
  { kind: "btn", icon: <Italic className="h-3.5 w-3.5" />,        title: "Italic",          cmd: "italic" },
  { kind: "btn", icon: <Underline className="h-3.5 w-3.5" />,     title: "Underline",       cmd: "underline" },
  { kind: "btn", icon: <Strikethrough className="h-3.5 w-3.5" />, title: "Strikethrough",   cmd: "strikeThrough" },
  { kind: "sep" },
  { kind: "btn", icon: <span className="text-[10px] font-black leading-none">H1</span>, title: "Heading 1", cmd: "formatBlock", val: "h1" },
  { kind: "btn", icon: <span className="text-[10px] font-black leading-none">H2</span>, title: "Heading 2", cmd: "formatBlock", val: "h2" },
  { kind: "btn", icon: <span className="text-[10px] font-black leading-none">H3</span>, title: "Heading 3", cmd: "formatBlock", val: "h3" },
  { kind: "btn", icon: <Type className="h-3.5 w-3.5" />,          title: "Paragraph",       cmd: "formatBlock", val: "p" },
  { kind: "sep" },
  { kind: "btn", icon: <List className="h-3.5 w-3.5" />,          title: "Bullet List",     cmd: "insertUnorderedList" },
  { kind: "btn", icon: <ListOrdered className="h-3.5 w-3.5" />,   title: "Numbered List",   cmd: "insertOrderedList" },
  { kind: "btn", icon: <Quote className="h-3.5 w-3.5" />,         title: "Blockquote",      cmd: "formatBlock", val: "blockquote" },
  { kind: "sep" },
  { kind: "btn", icon: <AlignLeft className="h-3.5 w-3.5" />,     title: "Align Left",      cmd: "justifyLeft" },
  { kind: "btn", icon: <AlignCenter className="h-3.5 w-3.5" />,   title: "Align Center",    cmd: "justifyCenter" },
  { kind: "btn", icon: <AlignRight className="h-3.5 w-3.5" />,    title: "Align Right",     cmd: "justifyRight" },
  { kind: "sep" },
  { kind: "btn", icon: <Link2 className="h-3.5 w-3.5" />,         title: "Insert Link",     cmd: "createLink" },
  { kind: "btn", icon: <Unlink2 className="h-3.5 w-3.5" />,       title: "Remove Link",     cmd: "unlink" },
  { kind: "sep" },
  { kind: "btn", icon: <Undo2 className="h-3.5 w-3.5" />,         title: "Undo",            cmd: "undo" },
  { kind: "btn", icon: <Redo2 className="h-3.5 w-3.5" />,         title: "Redo",            cmd: "redo" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  minRows = 6,
  dir = "ltr",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipSync = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== (value ?? "")) {
      skipSync.current = true;
      el.innerHTML = value ?? "";
      skipSync.current = false;
    }
  }, [value]);

  const emit = useCallback(() => {
    if (skipSync.current || !editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (cmd: string, val?: string) => {
      editorRef.current?.focus();
      if (cmd === "createLink") {
        const url = window.prompt("Enter URL:", "https://");
        if (url) document.execCommand("createLink", false, url);
      } else {
        document.execCommand(cmd, false, val);
      }
      emit();
    },
    [emit],
  );

  return (
    <div className={`overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-navy/20 ${className}`}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-secondary/60 px-2 py-1.5">
        {TOOLBAR.map((item, i) =>
          item.kind === "sep" ? (
            <span key={i} className="mx-1 h-4 w-px shrink-0 bg-border" />
          ) : (
            <button
              key={i}
              type="button"
              title={item.title}
              onMouseDown={e => {
                e.preventDefault();
                exec(item.cmd, item.val);
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-navy/70 transition-colors hover:bg-navy/10 hover:text-navy"
            >
              {item.icon}
            </button>
          ),
        )}
      </div>

      {/* ── Editable area ────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        dir={dir}
        onInput={emit}
        suppressContentEditableWarning
        className="w-full p-3 text-sm focus:outline-none
          [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-navy [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-navy [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy [&_h3]:mb-1
          [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:mb-2
          [&_blockquote]:border-s-4 [&_blockquote]:border-navy/30 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground [&_blockquote]:mb-2
          [&_a]:text-aqua [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
        data-placeholder={placeholder}
        style={{ minHeight: `${minRows * 1.6}rem` }}
      />
    </div>
  );
}
