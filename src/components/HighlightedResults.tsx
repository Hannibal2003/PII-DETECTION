
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiiMatch } from '@/utils/piiDetection';
import { Shield, ShieldAlert } from 'lucide-react';

interface HighlightedResultsProps {
  originalText: string;
  piiMatches: PiiMatch[];
  isMasked: boolean;
}

const HighlightedResults: React.FC<HighlightedResultsProps> = ({ 
  originalText, 
  piiMatches,
  isMasked
}) => {
  const createHighlightedHtml = () => {
    if (!originalText || piiMatches.length === 0) {
      return originalText;
    }

    const sortedMatches = [...piiMatches].sort((a, b) => b.position.start - a.position.start);
    let result = originalText;
    
    sortedMatches.forEach(match => {
      const { start, end } = match.position;
      const displayValue = isMasked ? match.maskedValue : match.value;
      const cssClass = isMasked ? "pii-masked" : "pii-highlight";
      
      result = 
        result.substring(0, start) + 
        `<span class="${cssClass}">${displayValue}</span>` + 
        result.substring(end);
    });
    
    return result.replace(/\n/g, '<br>');
  };

  return (
    <Card className="mt-4 border-2 border-privacy-100 dark:border-privacy-900">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {isMasked ? (
            <>
              <Shield className="h-5 w-5 text-privacy-600" />
              Protected Content
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-privacy-600" />
              Detected PII
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="prose max-w-none text-sm bg-white dark:bg-gray-900 p-6 rounded-md whitespace-pre-wrap border border-gray-100 dark:border-gray-800 shadow-sm"
          dangerouslySetInnerHTML={{ __html: createHighlightedHtml() }}
        />
      </CardContent>
    </Card>
  );
};

export default HighlightedResults;
