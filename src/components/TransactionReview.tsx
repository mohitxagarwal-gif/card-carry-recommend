import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

export interface ExtractedData {
  fileName: string;
  transactions: Transaction[];
  totalAmount: number;
  dateRange: { start: string; end: string };
  categoryTotals: Record<string, number>;
}

interface TransactionReviewProps {
  extractedData: ExtractedData[];
  onSubmit: () => void;
  onCancel: () => void;
}

export const TransactionReview = ({ extractedData, onSubmit, onCancel }: TransactionReviewProps) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set([extractedData[0]?.fileName]));

  const toggleFile = (fileName: string) => {
    setExpandedFiles(prev => {
      const updated = new Set(prev);
      if (updated.has(fileName)) {
        updated.delete(fileName);
      } else {
        updated.add(fileName);
      }
      return updated;
    });
  };

  const totalTransactions = extractedData.reduce((sum, data) => sum + data.transactions.length, 0);
  const totalSpending = extractedData.reduce((sum, data) => sum + data.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-playfair italic font-medium text-foreground mb-2">
          review extracted data
        </h2>
        <p className="text-lg font-sans text-muted-foreground">
          verify your transaction data before analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground">statements</p>
              <p className="text-2xl font-playfair italic font-medium">{extractedData.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground">total spending</p>
              <p className="text-2xl font-playfair italic font-medium">${totalSpending.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground">transactions</p>
              <p className="text-2xl font-playfair italic font-medium">{totalTransactions}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {extractedData.map((data) => (
          <Card key={data.fileName} className="border-border overflow-hidden">
            <button
              onClick={() => toggleFile(data.fileName)}
              className="w-full p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4 text-left">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-sans font-medium text-foreground">{data.fileName}</p>
                  <p className="text-sm font-sans text-muted-foreground">
                    {data.transactions.length} transactions • ${data.totalAmount.toFixed(2)} • 
                    {data.dateRange.start} to {data.dateRange.end}
                  </p>
                </div>
              </div>
              {expandedFiles.has(data.fileName) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedFiles.has(data.fileName) && (
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.categoryTotals).map(([category, amount]) => (
                    <Badge key={category} variant="secondary" className="font-sans">
                      {category}: ${amount.toFixed(2)}
                    </Badge>
                  ))}
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-sans">date</TableHead>
                        <TableHead className="font-sans">merchant</TableHead>
                        <TableHead className="font-sans">category</TableHead>
                        <TableHead className="text-right font-sans">amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.slice(0, 10).map((tx, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-sans text-sm">{tx.date}</TableCell>
                          <TableCell className="font-sans text-sm">{tx.merchant}</TableCell>
                          <TableCell className="font-sans text-sm">
                            <Badge variant="outline" className="font-sans text-xs">
                              {tx.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-sans text-sm">
                            ${tx.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.transactions.length > 10 && (
                    <div className="p-3 text-center text-sm font-sans text-muted-foreground bg-secondary/30">
                      and {data.transactions.length - 10} more transactions...
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} className="font-sans">
          cancel
        </Button>
        <Button onClick={onSubmit} className="font-sans py-6 px-8">
          submit for analysis
        </Button>
      </div>
    </div>
  );
};
