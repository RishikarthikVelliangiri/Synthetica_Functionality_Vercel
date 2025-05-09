"use client";

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneLight,
  vscDarkPlus,
  materialLight,
  materialOceanic,
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
    csv: 'csv', // Improved CSV display
    sql: 'sql',
    xml: 'xml',
    yaml: 'yaml',
    text: 'text'
  };

  // Get the appropriate language for syntax highlighting
  const syntaxLanguage = languageMap[language.toLowerCase()] || 'text';
  
  // Format-specific style customizations
  const getFormatStyles = () => {
    const baseStyles = {
      margin: 0,
      padding: '1.25rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      backgroundColor: isDark ? 'rgba(13, 17, 23, 0.95)' : 'rgba(250, 251, 254, 0.8)',
      maxHeight: '500px',
      overflowY: 'auto',
    };
    
    // Format-specific customizations
    switch (language.toLowerCase()) {
      case 'json':
        return {
          ...baseStyles,
          fontSize: '0.9rem',
          fontWeight: isDark ? 'normal' : '500',
        };
      case 'csv':
        return {
          ...baseStyles,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        };
      case 'sql':
        return {
          ...baseStyles,
          fontSize: '0.9rem',
        };
      case 'xml':
        return {
          ...baseStyles,
          fontSize: '0.875rem',
        };
      case 'yaml':
        return {
          ...baseStyles,
          fontSize: '0.9rem',
        };
      default:
        return baseStyles;
    }
  };

  // Choose appropriate style theme based on format
  const getStyleTheme = () => {
    if (isDark) {
      return language.toLowerCase() === 'json' ? materialOceanic : vscDarkPlus;
    } else {
      return language.toLowerCase() === 'json' ? materialLight : oneLight;
    }
  };

  // For CSV, we'll create a table-like presentation with custom formatting
  if (language.toLowerCase() === 'csv') {
    try {
      const formatCSV = (csvContent: string) => {
        const lines = csvContent.trim().split(/\r?\n/);
        if (lines.length === 0) return csvContent;
        
        // Handle header row differently (bold or highlighted)
        const header = lines[0];
        const parsedHeader = parseCSVLine(header);
        
        // Format as markdown table for better visual representation
        const formattedHeader = `| ${parsedHeader.join(' | ')} |`;
        const separator = `| ${parsedHeader.map(() => '---').join(' | ')} |`;
        
        // Format data rows
        const formattedRows = lines.slice(1).map(line => {
          const parsedLine = parseCSVLine(line);
          return `| ${parsedLine.join(' | ')} |`;
        });
        
        return [formattedHeader, separator, ...formattedRows].join('\n');
      };
      
      // Helper to parse CSV lines correctly (handling quoted fields with commas)
      const parseCSVLine = (line: string) => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
          } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current);
        
        return values.map(val => val.replace(/^"(.+)"$/, '$1'));
      };
      
      return (
        <SyntaxHighlighter
          language="markdown"
          style={isDark ? vscDarkPlus : oneLight}
          customStyle={getFormatStyles()}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono), Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }
          }}
          showLineNumbers={false}
        >
          {formatCSV(code)}
        </SyntaxHighlighter>
      );
    } catch (e) {
      // Fallback to standard display if CSV formatting fails
      console.error("CSV formatting error:", e);
    }
  }
  
  return (
    <SyntaxHighlighter
      language={syntaxLanguage}
      style={getStyleTheme()}
      customStyle={getFormatStyles()}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-mono), Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }
      }}
      showLineNumbers={language.toLowerCase() === 'sql' || language.toLowerCase() === 'json'}
      wrapLongLines={language.toLowerCase() === 'xml' || language.toLowerCase() === 'yaml'}
    >
      {code}
    </SyntaxHighlighter>
  );
}