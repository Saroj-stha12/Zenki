"use client";

import { useTheme } from "@/contexts/themeContext";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect } from "react";

type EditorProps = {
    setContent: (content: unknown) => void;
    initial?: unknown; // initial block content JSON
};



export default function Editor({ setContent, initial }: EditorProps) {
    // Create editor instance with initial content on mount
    const editor = useCreateBlockNote({ initialContent: initial as never });
    const { theme } = useTheme()
    useEffect(() => {
        if (!editor) return;

        // Subscribe to content changes
            const unsubscribe = editor.onChange(() => {
                setContent(editor.topLevelBlocks);
            });

        return () => {
            unsubscribe?.(); // unsubscribe on 
        };
    }, [editor, setContent]);

    if (!editor) return null; // or loading spinner

    return <BlockNoteView autoFocus theme={theme} editor={editor} />;
}
