import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter, Link as LinkIcon, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

const RichTextEditor = ({ value, onChange, placeholder, rows = 8 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content once and when value changes externally
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const tools: { icon: any; cmd: string; arg?: string; label: string }[] = [
    { icon: Bold, cmd: "bold", label: "Bold" },
    { icon: Italic, cmd: "italic", label: "Italic" },
    { icon: UnderlineIcon, cmd: "underline", label: "Underline" },
    { icon: Highlighter, cmd: "hiliteColor", arg: "#FFE58A", label: "Highlight" },
    { icon: Heading2, cmd: "formatBlock", arg: "<h2>", label: "Heading" },
    { icon: Heading3, cmd: "formatBlock", arg: "<h3>", label: "Subheading" },
    { icon: Quote, cmd: "formatBlock", arg: "<blockquote>", label: "Quote" },
    { icon: List, cmd: "insertUnorderedList", label: "Bulleted list" },
    { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered list" },
    { icon: AlignLeft, cmd: "justifyLeft", label: "Align left" },
    { icon: AlignCenter, cmd: "justifyCenter", label: "Align center" },
    { icon: AlignRight, cmd: "justifyRight", label: "Align right" },
    { icon: AlignJustify, cmd: "justifyFull", label: "Justify" },
  ];

  const onLink = () => {
    const url = prompt("Link URL");
    if (url) exec("createLink", url);
    onInput();
  };

  return (
    <div className={cn("rounded-xl border border-input bg-background overflow-hidden", isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background")}>
      <div className="flex items-center gap-0.5 flex-wrap border-b border-border/60 bg-secondary/40 p-1.5">
        {tools.map((t, i) => (
          <button
            key={i}
            type="button"
            title={t.label}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.arg); onInput(); }}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-primary transition-smooth"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <button type="button" title="Link" onMouseDown={(e) => { e.preventDefault(); onLink(); }} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-primary transition-smooth">
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={onInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        className="prose prose-sm max-w-none px-4 py-3 focus:outline-none text-foreground leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60"
        style={{ minHeight: `${rows * 1.6}rem` }}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
