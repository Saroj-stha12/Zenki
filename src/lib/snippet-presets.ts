export type SnippetPreset = {
  id: string;
  label: string;
  language: string;
  extension: string;
  starter: string;
};

export const SNIPPET_PRESETS: SnippetPreset[] = [
  { id: 'plaintext', label: 'Plain text', language: 'plaintext', extension: '.txt', starter: '' },
  { id: 'typescript', label: 'TypeScript', language: 'typescript', extension: '.ts', starter: 'export function main() {\n  return true;\n}\n' },
  { id: 'tsx', label: 'TypeScript React', language: 'typescriptreact', extension: '.tsx', starter: 'export default function Component() {\n  return <div />;\n}\n' },
  { id: 'javascript', label: 'JavaScript', language: 'javascript', extension: '.js', starter: 'function main() {\n  return true;\n}\n' },
  { id: 'jsx', label: 'JavaScript React', language: 'javascriptreact', extension: '.jsx', starter: 'export default function Component() {\n  return <div />;\n}\n' },
  { id: 'python', label: 'Python', language: 'python', extension: '.py', starter: 'def main():\n    return True\n' },
  { id: 'bash', label: 'Bash', language: 'shell', extension: '.sh', starter: '#!/usr/bin/env bash\nset -euo pipefail\n' },
  { id: 'json', label: 'JSON', language: 'json', extension: '.json', starter: '{\n  \n}\n' },
  { id: 'yaml', label: 'YAML', language: 'yaml', extension: '.yml', starter: '---\n' },
  { id: 'sql', label: 'SQL', language: 'sql', extension: '.sql', starter: 'select *\nfrom \nwhere ;\n' },
  { id: 'html', label: 'HTML', language: 'html', extension: '.html', starter: '<!doctype html>\n<html lang="en">\n  <body>\n  </body>\n</html>\n' },
  { id: 'css', label: 'CSS', language: 'css', extension: '.css', starter: ':root {\n  \n}\n' },
  { id: 'markdown', label: 'Markdown', language: 'markdown', extension: '.md', starter: '# Title\n\n' },
  { id: 'go', label: 'Go', language: 'go', extension: '.go', starter: 'package main\n\nfunc main() {\n}\n' },
  { id: 'rust', label: 'Rust', language: 'rust', extension: '.rs', starter: 'fn main() {\n}\n' },
];

export function getSnippetPreset(id: string) {
  return SNIPPET_PRESETS.find((preset) => preset.id === id) ?? SNIPPET_PRESETS[0];
}

