"use client";

import { useState } from "react";
import InputForm from "../components/InputForm";
import OutputDisplay from "../components/OutputDisplay";
import { motion } from "framer-motion";
import { FloatingShapes } from "../components/ui/floating-shapes";
import { ScrollReveal } from "../components/ui/scroll-reveal";
import { ConfettiEffect } from "../components/ui/confetti-effect";

const BATCH_SIZE = 100;

export default function Home() {
  const [generatedData, setGeneratedData] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<string>("json");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const handleSubmit = async (prompt: string, selectedFormat: string, count: number) => {
    setFormat(selectedFormat);
    setIsLoading(true);
    setError(null);

    try {
      let results: string[] = [];
      let totalBatches = Math.ceil(count / BATCH_SIZE);
      let allData: any[] = [];
      let allCsvRows: string[] = [];
      let csvHeader = "";
      let allSql: string[] = [];
      let allXmlItems: string[] = [];
      let xmlRootStart = ""; // Will store <?xml...><rootOpenTag>
      let xmlRootEnd = "";   // Will store </rootCloseTag>
      let allYaml: string[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const batchCount = i === totalBatches - 1 ? count - BATCH_SIZE * i : BATCH_SIZE;
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, format: selectedFormat, count: batchCount }),
        });
        if (!response.ok) {
          throw new Error("Failed to generate data. Please try again.");
        }
        const data = await response.json();
        const batch = data.data;
        // Merge logic for each format
        switch (selectedFormat) {
          case "json":
            try {
              const arr = JSON.parse(batch);
              if (Array.isArray(arr)) allData = allData.concat(arr);
            } catch {}
            break;
          case "csv":
            const lines = batch.trim().split(/\r?\n/);
            if (i === 0) {
              csvHeader = lines[0];
              allCsvRows = lines.slice(1);
            } else {
              allCsvRows = allCsvRows.concat(lines.slice(1));
            }
            break;
          case "sql":
            allSql.push(batch);
            break;
          case "xml": {
            let itemsToPush = "";
            let currentBatchContent = batch; // The full XML document string from the server for this batch

            // 1. Extract XML declaration from the current batch's content
            let actualDeclaration = "";
            const declMatch = currentBatchContent.match(/^<\?xml.*?\?>\s*/is);
            if (declMatch) {
              actualDeclaration = declMatch[0];
              currentBatchContent = currentBatchContent.substring(actualDeclaration.length); // Content after declaration
            }

            // 2. From the remaining content, find the root tag and extract inner items
            const rootTagMatch = currentBatchContent.match(/^<([a-zA-Z_][\w.-]*)(?:\s+[^>]*)?>/is); // Matches <tag> or <tag attr="">
            if (rootTagMatch) {
              const currentRootOpenTag = rootTagMatch[0]; // Full opening tag, e.g., <employees>
              const currentRootTagName = rootTagMatch[1]; // Tag name, e.g., employees
              const currentRootCloseTag = `</${currentRootTagName}>`; // e.g., </employees>

              // Extract content inside the root tags for the current batch
              if (currentBatchContent.startsWith(currentRootOpenTag) && currentBatchContent.endsWith(currentRootCloseTag)) {
                itemsToPush = currentBatchContent.substring(currentRootOpenTag.length, currentBatchContent.length - currentRootCloseTag.length).trim();
              } else {
                // Fallback if structure isn't <root>items</root> after declaration
                // This might happen if there's text outside, or self-closing root, etc.
                // For this API, assume valid <root>items</root> structure from server.
                itemsToPush = currentBatchContent; // Use content as-is (after declaration)
              }

              // 3. If it's the first batch, store the overall XML structure parts
              if (i === 0) {
                xmlRootStart = actualDeclaration + currentRootOpenTag; // e.g., <?xml ...?><employees>
                xmlRootEnd = currentRootCloseTag; // e.g., </employees>
              }
            } else {
              // No root tag found after declaration in the current batch
              itemsToPush = currentBatchContent; // Use content as-is (after declaration)
              if (i === 0) {
                // If the first batch also has no root tag, this is problematic for overall structure
                xmlRootStart = actualDeclaration; // Store at least the declaration
                xmlRootEnd = ""; // No root tag to close
              }
            }
            allXmlItems.push(itemsToPush);
            break;
          }
          case "yaml":
            allYaml.push(batch.trim());
            break;
          default:
            results.push(batch);
        }
      }
      // Combine results for each format
      let finalData = "";
      switch (selectedFormat) {
        case "json":
          finalData = JSON.stringify(allData, null, 2);
          break;
        case "csv":
          finalData = [csvHeader, ...allCsvRows].join("\n");
          break;
        case "sql":
          finalData = allSql.join("\n\n");
          break;
        case "xml":
          // Join all collected inner items and wrap with the declaration and root tags from the first batch
          finalData = allXmlItems.length > 0 ? `${xmlRootStart}\n${allXmlItems.join("\n")}\n${xmlRootEnd}` : "";
          break;
        case "yaml":
          finalData = allYaml.join("\n");
          break;
        default:
          finalData = results.join("\n");
      }
      setGeneratedData(finalData);

      // When done successfully, show confetti
      setShowConfetti(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      setGeneratedData("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gradient-to-b from-white to-blue-50">
      {/* Show confetti on successful data generation */}
      <ConfettiEffect
        show={showConfetti}
        duration={4000}
        onComplete={() => setShowConfetti(false)}
      />
      
      {/* Floating animated shapes in background */}
      <FloatingShapes 
        count={8} 
        colors={["#3b82f6", "#4f46e5", "#8b5cf6", "#6366f1", "#818cf8"]} 
        minSize={60} 
        maxSize={200}
      />
      
      <motion.div 
        className="absolute inset-0 -z-10 bg-[radial-gradient(40%_35%_at_60%_30%,rgba(153,183,255,0.12),rgba(76,29,149,0.05))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      <motion.header 
        className="w-full max-w-3xl mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-block"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="app-title text-4xl md:text-6xl mb-5 text-highlight">
            Synthetica
          </h1>
          <motion.div 
            className="flex items-center justify-center gap-2 text-blue-700/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="h-1 w-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></span>
            <p className="text-lg font-medium">AI Synthetic Data Generator</p>
            <span className="h-1 w-6 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></span>
          </motion.div>
        </motion.div>
      </motion.header>

      <div className="w-full max-w-3xl flex flex-col gap-8">
        <ScrollReveal 
          width="100%" 
          direction="up" 
          delay={0.1}
          viewOffset={{ top: -50, bottom: 0 }}
        >
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
        </ScrollReveal>

        <ScrollReveal 
          width="100%" 
          direction="up" 
          delay={0.3}
          viewOffset={{ top: -50, bottom: 0 }}
        >
          <OutputDisplay
            data={generatedData}
            isLoading={isLoading}
            error={error}
            format={format}
          />
        </ScrollReveal>
      </div>
    </main>
  );
}
