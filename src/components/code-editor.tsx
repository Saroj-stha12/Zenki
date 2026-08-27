'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

type Props = {
  value: string;
  language: string;
  onChange: (value: string) => void;
};

export default function CodeEditor({ value, language, onChange }: Props) {
  const [Editor, setEditor] = useState<ComponentType<{
    height: string;
    width: string;
    language: string;
    value: string;
    onChange: (value: string | undefined) => void;
    theme: string;
    options: Record<string, unknown>;
  }> | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([import('@monaco-editor/react'), import('monaco-editor')]).then(([reactMonaco, monaco]) => {
      reactMonaco.loader.config({ monaco });
      if (mounted) {
        setEditor(() => reactMonaco.default);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-[36rem] min-h-[28rem] flex-1 border border-[color:var(--outline)] bg-[color:var(--background)]">
      {Editor ? (
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={value}
          onChange={(next: string | undefined) => onChange(next ?? '')}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            roundedSelection: false,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      ) : (
        <div className="flex h-full min-h-[28rem] items-center justify-center text-sm text-[color:var(--alt)]">
          Loading editor...
        </div>
      )}
    </div>
  );
}
