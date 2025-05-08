"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { RadioGroup } from "./ui/radio-group";
import { Label } from "./ui/label";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface InputFormProps {
  onSubmit: (prompt: string, format: string, count: number) => void;
  isLoading?: boolean;
}

export default function InputForm({
  onSubmit = () => {},
  isLoading = false,
}: InputFormProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("json");
  const [count, setCount] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && count > 0) {
      onSubmit(prompt, format, count);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-100/50 hover:shadow-xl hover:bg-white/90 transition-all duration-300 transform hover:-translate-y-1"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <label htmlFor="count" className="text-lg font-medium text-blue-800 block mb-2">
            Number of entries
          </label>
          <motion.input
            whileTap={{ scale: 0.98 }}
            id="count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="w-32 border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 outline-none mt-1"
            disabled={isLoading}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label htmlFor="prompt" className="text-lg font-medium text-blue-800">
            Describe the synthetic data you need
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the synthetic data you need... e.g., '5 sample JSON objects for user profiles with name, email, and city'"
            className="min-h-[150px] resize-y border-blue-200 focus:border-blue-400 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-300"
            disabled={isLoading}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-md font-medium text-blue-800">
            Select Output Format
          </h3>
          <RadioGroup
            value={format}
            onValueChange={setFormat}
            className="flex flex-wrap gap-4"
          >
            {[
              { value: "json", color: "amber", label: "JSON" },
              { value: "csv", color: "green", label: "CSV" },
              { value: "sql", color: "blue", label: "SQL" },
              { value: "xml", color: "purple", label: "XML" },
              { value: "yaml", color: "rose", label: "YAML" },
            ].map((formatOption) => {
              // Map color names to their actual hex values for direct styling
              const getColorValue = (color: string, isSelected: boolean) => {
                const colorMap: Record<string, {bg: string, border: string}> = {
                  amber: { bg: "#f59e0b", border: "#d97706" },
                  green: { bg: "#10b981", border: "#059669" },
                  blue: { bg: "#3b82f6", border: "#2563eb" },
                  purple: { bg: "#8b5cf6", border: "#7c3aed" },
                  rose: { bg: "#f43f5e", border: "#e11d48" }
                };
                return isSelected ? colorMap[color] : { bg: "#ffffff", border: "#d1d5db" };
              };
              
              const isSelected = format === formatOption.value;
              const colorValue = getColorValue(formatOption.color, isSelected);
              const bgColorClass = `bg-${formatOption.color}-500`;
              
              return (
                <motion.div 
                  key={formatOption.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center space-x-2"
                >
                  <div className="relative">
                    <div 
                      className="aspect-square h-4 w-4 rounded-full border shadow cursor-pointer"
                      style={{ 
                        backgroundColor: colorValue.bg,
                        borderColor: colorValue.border
                      }}
                      onClick={() => setFormat(formatOption.value)}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                    <input 
                      type="radio" 
                      id={formatOption.value} 
                      name="format" 
                      value={formatOption.value} 
                      checked={isSelected}
                      onChange={() => setFormat(formatOption.value)}
                      className="sr-only" // Hide actual radio but keep accessibility
                    />
                  </div>
                  <Label 
                    htmlFor={formatOption.value} 
                    className="cursor-pointer font-medium flex items-center gap-1"
                  >
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-sm text-[10px] text-white font-bold ${bgColorClass}`}>
                      {formatOption.label.substring(0, 1)}
                    </span>
                    <span>{formatOption.label}</span>
                  </Label>
                </motion.div>
              );
            })}
          </RadioGroup>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            disabled={isLoading || !prompt.trim() || count < 1}
          >
            {isLoading ? 
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((index) => (
                    <div 
                      key={index} 
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" 
                      style={{ animationDelay: `${index * 0.1}s` }}
                    ></div>
                  ))}
                </div>
                <span>Processing...</span>
              </div> : 
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Data</span>
              </>
            }
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
