"use client";

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneLight,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  isDark?: boolean;
}

export function CodeHighlighter({ 
  code, 
  language, 
  isDark = false 
}: SyntaxHighlighterProps) {
  // Map our format names to syntax highlighter language names
  const languageMap: Record<string, string> = {
    json: 'json',
    csv: 'markdown', // Using markdown for CSV as it's readable
    sql: 'sql',
    xml: 'xml',
    yaml: 'yaml',
    text: 'text'
  };

  // Get the appropriate language for syntax highlighting
  const syntaxLanguage = languageMap[language.toLowerCase()] || 'text';
  
  return (
    <SyntaxHighlighter
      language={syntaxLanguage}
      style={isDark ? vscDarkPlus : oneLight}
      customStyle={{
        margin: 0,
        padding: '1.25rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        backgroundColor: isDark ? 'rgba(13, 17, 23, 0.95)' : 'rgba(250, 251, 254, 0.8)',
        maxHeight: '500px',
        overflowY: 'auto',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-mono), Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}