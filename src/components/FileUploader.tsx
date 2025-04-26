
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileContent: (content: string, fileName: string) => void;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileContent, className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);

    // Check file type
    const validTypes = ['text/plain', 'text/csv', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a valid file (TXT, CSV, PDF)');
      setIsLoading(false);
      return;
    }

    // For simplicity in this demo, we'll just read text files
    try {
      const text = await file.text();
      setFileName(file.name);
      onFileContent(text, file.name);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${className || ''}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium">
            {isLoading ? (
              <span className="animate-pulse-opacity">Processing file...</span>
            ) : fileName ? (
              <span className="text-primary">{fileName}</span>
            ) : (
              <>
                <span className="text-primary">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">TXT, CSV, PDF (Max 10MB)</p>
        </div>
      </div>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".txt,.csv,.pdf"
      />
      {fileName && !isLoading && (
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={triggerFileInput}>
            Change file
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
