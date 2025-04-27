
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiiSummary } from '@/utils/piiDetection';
import { CheckCircle, XCircle } from 'lucide-react';

interface PiiSummaryTableProps {
  summary: PiiSummary[];
}

const PiiSummaryTable: React.FC<PiiSummaryTableProps> = ({ summary }) => {
  if (summary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="text-alert-green h-5 w-5 mr-2" />
            PII Detection Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No PII detected in the provided content
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPiiCount = summary.reduce((sum, item) => sum + item.count, 0);

  const getPiiSeverity = (piiType: string): 'high' | 'medium' | 'low' => {
    const highRisk = ['Aadhaar', 'PAN', 'CreditCard', 'BankAccount'];
    const mediumRisk = ['Email', 'Mobile', 'DOB', 'IFSC'];
    
    if (highRisk.includes(piiType)) return 'high';
    if (mediumRisk.includes(piiType)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high': return 'text-alert-red';
      case 'medium': return 'text-alert-amber';
      case 'low': return 'text-privacy-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <XCircle className="text-alert-red h-5 w-5 mr-2" />
          PII Detection Results
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({totalPiiCount} items found)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PII Category</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((item) => {
              const severity = getPiiSeverity(item.type);
              return (
                <TableRow key={item.type}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getSeverityColor(severity)}`}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PiiSummaryTable;
