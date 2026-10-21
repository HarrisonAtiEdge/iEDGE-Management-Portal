import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import { letterDocument } from "./rtgsLetter";

export interface LetterFrameHandle {
  /** The (possibly edited) letter body HTML. */
  getHTML: () => string;
}

interface LetterFrameProps {
  html: string;
  /** Lets the user edit the letter text in place. */
  editable?: boolean;
  className?: string;
}

/**
 * Shows a letter in a sandboxed iframe at A4 proportions. Scripts never run in
 * it (no allow-scripts), so stored now in the letter HTML can't execute anything, and its
 * CSS stays inside the frame.
 */
const LetterFrame = forwardRef<LetterFrameHandle, LetterFrameProps>(
  ({ html, editable = false, className }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      getHTML: () => iframeRef.current?.contentDocument?.body?.innerHTML ?? html,
    }));

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const applyEditable = () => {
        const frameDoc = iframe.contentDocument;
        if (frameDoc) frameDoc.designMode = editable ? "on" : "off";
      };
      applyEditable();
      iframe.addEventListener("load", applyEditable);
      return () => iframe.removeEventListener("load", applyEditable);
    }, [editable, html]);

    return (
      <iframe
        ref={iframeRef}
        title="RAAST letter preview"
        sandbox="allow-same-origin"
        srcDoc={letterDocument(html, { preview: true })}
        className={cn(
          "aspect-[210/297] w-full rounded-xl border bg-white shadow-sm",
          editable && "ring-2 ring-primary/40",
          className,
        )}
      />
    );
  },
);

LetterFrame.displayName = "LetterFrame";

export default LetterFrame;
