
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { detectPii, getPiiSummary, highlightPiiInText, PiiMatch } from "@/utils/piiDetection";
import { downloadTextAsFile } from "@/utils/exportUtils";
import { Eye, EyeOff, Download, Search } from "lucide-react";

import Header from "@/components/Header";
import FileUploader from "@/components/FileUploader";
import PiiSummaryTable from "@/components/PiiSummaryTable";
import HighlightedResults from "@/components/HighlightedResults";

const Index = () => {
  const [text, setText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [piiMatches, setPiiMatches] = useState<PiiMatch[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [maskPii, setMaskPii] = useState<boolean>(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (isAnalyzed) {
      setIsAnalyzed(false);
      setPiiMatches([]);
    }
  };

  const handleFileContent = (content: string, name: string) => {
    setText(content);
    setFileName(name);
    if (isAnalyzed) {
      setIsAnalyzed(false);
      setPiiMatches([]);
    }
  };

  const analyzeText = async () => { // Make the function async
    if (!text.trim()) {
      toast.error("Please enter some text or upload a file first");
      return;
    }

    setIsLoading(true);
    setIsAnalyzed(false); // Reset analysis state
    setPiiMatches([]);    // Clear previous matches

    try {
      const matches = await detectPii(text); // Await the async function result
      setPiiMatches(matches);
      setIsAnalyzed(true);
      
      if (matches.length > 0) {
        toast.success(`Detected ${matches.length} PII instances`);
      } else {
        toast.info("No PII detected in the text");
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      // Check if error is an instance of Error to safely access message
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
      toast.error(`Error analyzing text: ${errorMessage}`);
      // Ensure state reflects that analysis didn't complete successfully
      setIsAnalyzed(false);
      setPiiMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!isAnalyzed || !text) {
      toast.error("Please analyze text before exporting");
      return;
    }
    
    try {
      // Create masked version of the text
      const maskedText = piiMatches.length > 0
        ? highlightPiiInText(text, piiMatches, true)
          .replace(/<span class="pii-masked">([^<]+)<\/span>/g, '$1')
        : text;
      
      const outputFilename = fileName 
        ? `redacted_${fileName}` 
        : `redacted_text_${new Date().toISOString().slice(0,10)}.txt`;
      
      downloadTextAsFile(maskedText, outputFilename);
      toast.success("File exported successfully");
    } catch (error) {
      console.error("Error exporting file:", error);
      toast.error("Error exporting file");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>PII Detection Tool</CardTitle>
              <CardDescription>
                Detect personally identifiable information (PII) in your text or files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="text">Text Input</TabsTrigger>
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text">
                  <Textarea 
                    placeholder="Enter your text here to scan for PII..."
                    className="min-h-[200px]"
                    value={text}
                    onChange={handleTextChange}
                  />
                </TabsContent>
                
                <TabsContent value="file">
                  <FileUploader onFileContent={handleFileContent} />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mask-pii"
                  checked={maskPii}
                  onCheckedChange={setMaskPii}
                />
                <Label htmlFor="mask-pii" className="flex items-center space-x-1">
                  {maskPii ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Mask PII</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Highlight PII</span>
                    </>
                  )}
                </Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleExport}
                  disabled={!isAnalyzed || piiMatches.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Redacted
                </Button>
                <Button 
                  onClick={analyzeText}
                  disabled={isLoading || !text.trim()}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-pulse-opacity">Analyzing...</span>
                    </span>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze Text
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {isAnalyzed && (
            <>
              <PiiSummaryTable 
                summary={getPiiSummary(piiMatches)} 
              />
              
              {text && (
                <HighlightedResults 
                  originalText={text} 
                  piiMatches={piiMatches}
                  isMasked={maskPii}
                />
              )}
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Privacy Sentinel PII Detector &copy; {new Date().getFullYear()} | For demonstration purposes only
        </div>
      </footer>
    </div>
  );
};

export default Index;
