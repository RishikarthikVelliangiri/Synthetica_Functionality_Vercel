"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { CheckIcon, CopyIcon, DownloadIcon, Code, FileJson, FileSpreadsheet, Database, FileCode, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeHighlighter } from "./ui/syntax-highlighter";

interface OutputDisplayProps {
  data: string;
  isLoading: boolean;
  error: string | null;
  format?: string;
}

const OutputDisplay = ({
  data = "",
  isLoading = false,
  error = null,
  format = "json",
}: OutputDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const downloadData = () => {
    if (format === "csv") {
      // Clean CSV: only include columns in header row
      const lines = data.trim().split(/\r?\n/);
      if (lines.length < 2) return; // nothing to download
      const header = lines[0];
      const headers = header.split(",").map(h => h.trim());
      // Only keep columns in header row for each data row
      const cleanedRows = [header];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        // Handle quoted fields and commas inside quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let c = 0, col = 0; c < row.length; c++) {
          const char = row[c];
          if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
          } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            col++;
          } else {
            current += char;
          }
        }
        values.push(current);
        // Only keep as many columns as in header
        cleanedRows.push(headers.map((_, idx) => values[idx] ?? '').join(","));
      }
      const cleanedCsv = cleanedRows.join("\n");
      const blob = new Blob([cleanedCsv], { type: getContentType(format) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synthetic-data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      return;
    }
    const blob = new Blob([data], { type: getContentType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthetic-data.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Detect the format from the data content if not explicitly provided
  const detectFormat = (data: string): string => {
    if (!data) return format;

    const lowerData = data.trim().toLowerCase();
    if (lowerData.startsWith("{") || lowerData.startsWith("[")) return "json";
    if (lowerData.includes("create table") || lowerData.includes("insert into"))
      return "sql";
    if (
      lowerData.startsWith("<?xml") ||
      (lowerData.startsWith("<") &&
        lowerData.includes("</") &&
        lowerData.includes(">"))
    )
      return "xml";
    if (lowerData.includes(",") && lowerData.split("\n")[0].includes(","))
      return "csv";
    if (
      lowerData.includes(":") &&
      lowerData.includes("-") &&
      !lowerData.includes("{")
    )
      return "yaml";

    return format;
  };

  const getContentType = (format: string) => {
    switch (format.toLowerCase()) {
      case "json":
        return "application/json";
      case "csv":
        return "text/csv";
      case "sql":
        return "application/sql";
      case "xml":
        return "application/xml";
      case "yaml":
        return "application/yaml";
      default:
        return "text/plain";
    }
  };
  
  // Get appropriate icon for the format
  const getFormatIcon = () => {
    switch(format.toLowerCase()) {
      case "json": return <FileJson className="h-4 w-4 text-amber-500" />;
      case "csv": return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "sql": return <Database className="h-4 w-4 text-blue-500" />;
      case "xml": return <FileCode className="h-4 w-4 text-purple-500" />;
      case "yaml": return <FileText className="h-4 w-4 text-rose-500" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  // Map format to color for UI elements
  const getFormatColor = (format: string) => {
    switch(format.toLowerCase()) {
      case "json": return "amber";
      case "csv": return "green";
      case "sql": return "blue";
      case "xml": return "purple";
      case "yaml": return "rose";
      default: return "blue";
    }
  };
  
  const formatColor = getFormatColor(format);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="flex justify-between items-center mb-3">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <h2 className="text-lg font-medium bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Generated Data
          </h2>
          {data && (
            <div className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-${formatColor}-700 bg-${formatColor}-100/50 rounded-full border border-${formatColor}-200/50`}>
              {getFormatIcon()}
              <span>{format.toUpperCase()}</span>
            </div>
          )}
        </motion.div>
        <AnimatePresence>
          {data && (
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${copied ? 
                    'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 
                    'border-blue-200 hover:bg-blue-50 hover:border-blue-300'} 
                    transition-all duration-300 shadow-sm`}
                  disabled={isLoading || !data}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={downloadData}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm 
                    ${showSuccess ? 'border-green-300 bg-green-50 text-green-700' : ''}`}
                  disabled={isLoading || !data}
                >
                  {showSuccess ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4" />
                      <span>Download</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Card className="w-full border border-blue-100/50 shadow-lg rounded-xl overflow-hidden backdrop-blur-sm bg-white/80 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 p-5"
              >
                <div className="flex flex-col items-center mb-5">
                  <div className="relative mb-3">
                    <div className="h-10 w-10">
                      <div className="absolute h-10 w-10 rounded-full border-4 border-blue-200"></div>
                      <div className="absolute h-10 w-10 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className={`h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse`}></div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium mt-2">
                    Generating {format.toUpperCase()} data...
                  </div>
                  <div className="text-xs text-blue-400 mt-1 animate-pulse">
                    This may take a few moments
                  </div>
                </div>
                
                <Skeleton className="h-4 w-full bg-blue-100/70" />
                <Skeleton className="h-4 w-5/6 bg-blue-100/70" />
                <Skeleton className="h-4 w-4/5 bg-blue-100/70" />
                <Skeleton className="h-4 w-3/4 bg-blue-100/70" />
                <Skeleton className="h-4 w-5/6 bg-blue-100/70" />
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-500 p-5 bg-red-50/80 rounded-lg border border-red-200"
              >
                {error}
              </motion.div>
            ) : data ? (
              <motion.div 
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-auto max-h-[500px] rounded-lg shadow-inner"
              >
                <CodeHighlighter code={data} language={format} />
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-blue-500 text-center py-12 bg-blue-50/50 rounded-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <Code className="h-6 w-6 text-blue-400 opacity-70" />
                  <p className="font-medium">Generated data will appear here</p>
                  <p className="text-xs mt-2 text-blue-400">Fill the form above and click on Generate Data</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OutputDisplay;
