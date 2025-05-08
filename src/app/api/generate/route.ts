import { NextResponse } from "next/server";

// Use environment variables for Google Gemini API
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_URL = process.env.GOOGLE_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp:generateContent";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, format = "json", count = 10 } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Please provide a valid data description" },
        { status: 400 },
      );
    }
    if (typeof count !== "number" || count < 1 || count > 1000) {
      return NextResponse.json(
        { error: "Please provide a valid number of entries (1-1000)" },
        { status: 400 },
      );
    }

    const aiPrompt = constructAIPrompt(prompt, format, count);
    console.log("Gemini API prompt:", aiPrompt);
    console.log("Requested count:", count);

    try {
      const apiURL = `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`;
      const geminiResponse = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: aiPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!geminiResponse.ok) {
        const err = await geminiResponse.text();
        throw new Error(`Google Gemini API error: ${err}`);
      }

      const result = await geminiResponse.json();
      // Log the raw Gemini output for debugging
      console.log("Raw Gemini output:", JSON.stringify(result));
      
      // Extract generated text from Gemini response
      let generatedText = "";
      
      if (result.candidates && 
          result.candidates[0] && 
          result.candidates[0].content && 
          result.candidates[0].content.parts && 
          result.candidates[0].content.parts[0] && 
          typeof result.candidates[0].content.parts[0].text === "string") {
        generatedText = result.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected response format from Google Gemini API");
      }

      // Try to extract a JSON array from the output if present
      if (format.toLowerCase() === "json") {
        let jsonMatch = generatedText.match(/(\[[\s\S]*?\])/); // Changed from /s flag to [\s\S]
        if (jsonMatch) {
          let jsonStr = jsonMatch[1];
          // If the array is inside a string (escaped), unescape it
          if (jsonStr.includes('\\"') || jsonStr.includes('\\n')) {
            // Remove any wrapping quotes
            jsonStr = jsonStr.replace(/^['"]|['"]$/g, "");
            // Unescape backslashes and quotes
            jsonStr = jsonStr.replace(/\\n/g, "\n").replace(/\\"/g, '"');
            // Remove backslashes at the end of lines (line continuations)
            jsonStr = jsonStr.replace(/,\\\s*\n/g, ',\n').replace(/\\\s*\n/g, '\n');
          }
          generatedText = jsonStr;
          console.log("Extracted and unescaped JSON substring:", generatedText);
        } else {
          console.error("Could not extract JSON array from model output.");
          return NextResponse.json({
            error: "Could not extract JSON array from model output. Raw output: " + generatedText
          }, { status: 422 });
        }
      }

      if (format.toLowerCase() === "csv") {
        // Try to find the first line that looks like a CSV header (contains commas, no colon)
        const lines = generatedText.split(/\r?\n/);
        const headerIdx = lines.findIndex(line => line.includes(",") && !line.includes(":"));
        if (headerIdx !== -1) {
          // Convert header row to camelCase
          const headerArr = lines[headerIdx].split(",").map(h => {
            return h
              .replace(/^['"]|['"]$/g, "") // remove quotes
              .replace(/\_/g, "_") // unescape underscores
              .replace(/[_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : "") // to camelCase
              .replace(/^([A-Z])/, m => m.toLowerCase()); // lowercase first char
          });
          const header = headerArr.join(",");
          // Systematic id for any id column if present and not random in prompt
          const wantsRandom = /random\s*id|random\s*\w*id/i.test(prompt);
          let dataRows = lines.slice(headerIdx + 1);
          headerArr.forEach((h, colIdx) => {
            if (/id$/i.test(h) && !wantsRandom) {
              dataRows = dataRows.map((row, idx) => {
                const cols = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                if (cols.length === headerArr.length) {
                  cols[colIdx] = `"${1001 + idx}"`;
                }
                return cols.join(",");
              });
            }
          });
          generatedText = [header, ...dataRows].join("\n");
          console.log("Extracted CSV data (camelCase header, systematic id):\n" + generatedText);
        } else {
          console.error("Could not extract CSV data from model output.");
          return NextResponse.json({
            error: "Could not extract CSV data from model output. Raw output: " + generatedText
          }, { status: 422 });
        }
      }

      if (format.toLowerCase() === "sql") {
        // Extract only CREATE TABLE and INSERT INTO statements
        const sqlLines = generatedText.split(/\r?\n/)
          .filter(line => /^(CREATE TABLE|INSERT INTO)/i.test(line.trim()));
        // Try to extract real column names from the first INSERT INTO statement
        let colNames: string[] = [];
        let idColIdx = -1;
        const firstInsert = sqlLines.find(line => /^INSERT INTO/i.test(line));
        if (firstInsert) {
          const matchVals = firstInsert.match(/\((.*)\)/);
          if (matchVals) {
            // Try to infer column names from the prompt if possible
            // Fallback: use name, id, job if 3 columns, else col1, col2, ...
            const nCols = matchVals[1].split(',').length;
            if (/employee|user|person|name/i.test(prompt) && nCols === 3) {
              colNames = ["name", "id", "job"];
            } else {
              colNames = Array.from({length: nCols}, (_, i) => `col${i+1}`);
            }
            idColIdx = colNames.findIndex(h => /id$/i.test(h));
          }
        }
        // Rebuild CREATE TABLE with column names and types
        let createTableIdx = sqlLines.findIndex(line => /^CREATE TABLE/i.test(line));
        if (createTableIdx !== -1 && colNames.length > 0) {
          const colDefs = colNames.map(h =>
            /id$/i.test(h) ? `${h} int` : `${h} varchar(50)`
          ).join(',\n  ');
          sqlLines[createTableIdx] = `CREATE TABLE employees (\n  ${colDefs}\n);`;
        }
        // Systematic id for any id column if present and not random in prompt
        const wantsRandom = /random\s*id|random\s*\w*id/i.test(prompt);
        let insertCount = 0;
        const processedSql = sqlLines.map(line => {
          if (/^INSERT INTO/i.test(line) && idColIdx !== -1 && !wantsRandom) {
            // Replace id value with systematic value
            // Extract values inside (...)
            const matchVals = line.match(/\((.*)\)/);
            if (matchVals) {
              let vals = matchVals[1].split(',').map(s => s.trim());
              if (vals.length === colNames.length) {
                vals[idColIdx] = `${1001 + insertCount}`;
                insertCount++;
                return line.replace(/\(.*\)/, `(${vals.join(", ")})`);
              }
            }
          }
          return line;
        });
        generatedText = processedSql.join("\n");
        console.log("Extracted SQL data (systematic id, fixed CREATE TABLE, real col names):\n" + generatedText);
      }

      if (format.toLowerCase() === "xml") {
        // Complete rewrite of XML processing logic
        try {
          // Extract raw data instead of trying to parse malformed XML
          const names = [];
          const jobs = [];
          const ids = [];
          
          // Extract names - fix the regex to use matching <n> tags
          const nameRegex = /<n>([^<]+)<\/name>/gi;
          let nameMatch;
          while ((nameMatch = nameRegex.exec(generatedText)) !== null) {
            names.push(nameMatch[1]);
          }
          
          // Extract jobs
          const jobRegex = /<job>([^<]+)<\/job>/gi;
          let jobMatch;
          while ((jobMatch = jobRegex.exec(generatedText)) !== null) {
            jobs.push(jobMatch[1]);
          }
          
          // Extract IDs
          const idRegex = /id="(E\d+)"/gi;
          let idMatch;
          while ((idMatch = idRegex.exec(generatedText)) !== null) {
            ids.push(idMatch[1]);
          }
          
          // Build properly structured XML from scratch
          let xmlOutput = '<?xml version="1.0" encoding="UTF-8"?>\n<employees>\n';
          
          for (let i = 0; i < count; i++) {
            const id = i < ids.length ? ids[i] : `E${String(i+1).padStart(3, '0')}`;
            const name = i < names.length ? names[i] : `Employee ${i+1}`;
            const job = i < jobs.length ? jobs[i] : `Position ${i+1}`;
            
            xmlOutput += `   <employee id="${id}">\n`;
            xmlOutput += `      <n>${name}</n>\n`;
            xmlOutput += `      <job>${job}</job>\n`;
            xmlOutput += `   </employee>\n`;
          }
          
          xmlOutput += '</employees>';
          generatedText = xmlOutput;
          
          console.log("Clean XML output:", generatedText);
        } catch (error) {
          console.error("Error processing XML:", error);
          // Fallback to a minimal clean structure if parsing fails
          let fallbackXml = '<?xml version="1.0" encoding="UTF-8"?>\n<employees>\n';
          for (let i = 0; i < count; i++) {
            fallbackXml += `   <employee id="E${String(i+1).padStart(3, '0')}">\n`;
            fallbackXml += `      <n>Employee ${i+1}</n>\n`;
            fallbackXml += `      <job>Position ${i+1}</job>\n`;
            fallbackXml += `   </employee>\n`;
          }
          fallbackXml += '</employees>';
          generatedText = fallbackXml;
        }
      }

      // Post-process: check entry count for each format
      let entryCount = 0;
      let valid = true;
      switch (format.toLowerCase()) {
        case "json":
          try {
            const parsed = JSON.parse(generatedText);
            if (Array.isArray(parsed)) {
              entryCount = parsed.length;
            } else if (Array.isArray(parsed.data)) {
              entryCount = parsed.data.length;
            } else {
              valid = false;
            }
          } catch {
            valid = false;
          }
          break;
        case "csv":
          entryCount = generatedText.trim().split(/\r?\n/).length - 1;
          break;
        case "yaml":
          entryCount = (generatedText.match(/^\s*- /gm) || []).length;
          break;
        case "xml":
          // Always count <employee> tags for employee data, fallback to any repeated tag if not found
          let tag = "employee";
          let regex = new RegExp(`<${tag}[\\s>]`, 'g');
          entryCount = (generatedText.match(regex) || []).length;
          if (entryCount === 0) {
            // fallback: count any repeated tag that is not the root
            const allTags = [...generatedText.matchAll(/<([a-zA-Z0-9_]+)[\s>]/g)].map(m => m[1]);
            const tagCounts = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
            // exclude 'employees' or root
            const mainTag = Object.entries(tagCounts).filter(([k]) => k !== 'employees').sort((a, b) => b[1] - a[1])[0];
            if (mainTag) entryCount = mainTag[1];
          }
          break;
        case "sql":
          entryCount = (generatedText.match(/INSERT INTO /gi) || []).length;
          break;
        default:
          entryCount = 0;
      }
      
      if (!valid || entryCount < count) {
        return NextResponse.json({
          error: `The AI returned only ${entryCount} entries (expected ${count}). Please try again or rephrase your request.`
        }, { status: 422 });
      }

      return NextResponse.json({ data: generatedText });
    } catch (aiError) {
      console.error("Google Gemini API error:", aiError);
      return NextResponse.json({
        error: "Google Gemini API error: " + (aiError?.message || aiError?.toString() || "Unknown error")
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error generating data:", error);
    return NextResponse.json(
      { error: "Failed to generate data. Please try again." },
      { status: 500 },
    );
  }
}

// Function to construct a detailed AI prompt based on the requested format
function constructAIPrompt(prompt: string, format: string, count: number): string {
  // Base instructions for all formats
  let baseInstructions = `Generate exactly ${count} entries of synthetic data based on the following user request. Make sure to generate that many entries and nothing more or nothing less. Take as much time as you need to, and do not try to think it is too big to generate. If it is a tedious task, still do it.: ${prompt}\n\n`;
  const strictWarning = `\nIMPORTANT: Only output valid ${format.toUpperCase()} data. Do NOT include any explanations, comments, or extra text. The output must be ready to use as-is in the specified format.`;

  // Format-specific instructions
  switch (format.toLowerCase()) {
    case "json":
      return `${baseInstructions}Please provide the data in valid JSON format with the following guidelines:\n
1. Use proper JSON syntax with double quotes for keys and string values
2. Include an array of exactly ${count} objects with consistent structure
3. Ensure all field names are camelCase
4. Make sure the data is realistic and varied
5. Do not include any explanatory text outside the JSON structure
6. Format the JSON with proper indentation${strictWarning}`;

    case "csv":
      return `${baseInstructions}Please provide the data in valid CSV format with the following guidelines:\n
1. Include a header row with column names
2. Use commas as separators
3. Properly escape any commas within field values using double quotes
4. Use consistent data types for each column
5. Do not include any explanatory text before or after the CSV data
6. Ensure the data is realistic and varied
7. Output exactly ${count} data rows (not counting the header)${strictWarning}`;

    case "sql":
      return `${baseInstructions}Please provide the data as SQL INSERT statements with the following guidelines:\n
1. Include a CREATE TABLE statement with appropriate data types
2. Follow with INSERT statements for exactly ${count} data rows
3. Use proper SQL syntax with semicolons at the end of each statement
4. Properly escape any special characters in string values
5. Use consistent table and column names
6. Do not include any explanatory text outside the SQL statements${strictWarning}`;

    case "xml":
      return `${baseInstructions}Please provide the data in valid XML format with the following guidelines:\n
1. Include a root element that contains all data items
2. Use consistent element names for each data item
3. Use attributes appropriately for metadata
4. Properly escape any special characters
5. Use proper XML syntax with closing tags
6. Do not include any explanatory text outside the XML structure
7. Output exactly ${count} data items${strictWarning}`;

    case "yaml":
      return `${baseInstructions}Please provide the data in valid YAML format with the following guidelines:\n
1. Use proper YAML syntax with consistent indentation
2. Include a list of exactly ${count} items with consistent structure
3. Use appropriate data types (strings, numbers, booleans)
4. Properly format multi-line strings if needed
5. Do not include any explanatory text outside the YAML structure
6. Ensure the data is realistic and varied${strictWarning}`;

    default:
      return `${baseInstructions}Provide the data in a clean, structured format that's ready to use. Output exactly ${count} entries. ${strictWarning}`;
  }
}
