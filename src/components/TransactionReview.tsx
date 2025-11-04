import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, CheckCircle2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { formatINR } from "@/lib/pdfProcessor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { STANDARD_CATEGORIES, normalizeCategory } from "@/lib/categories";

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  type?: 'debit' | 'credit';
  transactionType?: 'debit' | 'credit';
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
  onSubmit: (editedData: ExtractedData[]) => void;
  onCancel: () => void;
}

export function TransactionReview({ extractedData, onSubmit, onCancel }: TransactionReviewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set([extractedData[0]?.fileName]));
  const [localData, setLocalData] = useState<ExtractedData[]>(
    extractedData.map(data => ({
      ...data,
      transactions: data.transactions.map(t => ({
        ...t,
        category: normalizeCategory(t.category),
        transactionType: (t.transactionType || t.type || "debit") as 'debit' | 'credit'
      }))
    }))
  );

  const toggleFile = (fileName: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName);
    } else {
      newExpanded.add(fileName);
    }
    setExpandedFiles(newExpanded);
  };

  const handleCategoryChange = async (fileIndex: number, txIndex: number, newCategory: string) => {
    const updatedData = [...localData];
    const transaction = updatedData[fileIndex].transactions[txIndex];
    const oldCategory = transaction.category;
    
    // Update local state
    updatedData[fileIndex].transactions[txIndex].category = newCategory;
    
    // Recalculate category totals
    const categoryTotals: Record<string, number> = {};
    updatedData[fileIndex].transactions.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });
    updatedData[fileIndex].categoryTotals = categoryTotals;
    
    setLocalData(updatedData);

    // Submit feedback to improve merchant intelligence
    try {
      await supabase.functions.invoke('update-merchant-category', {
        body: {
          merchant: transaction.merchant,
          oldCategory,
          newCategory,
          confidence: 1.0
        }
      });
    } catch (error) {
      console.error('Failed to update merchant category:', error);
    }
  };

  const totalTransactions = localData.reduce((sum, data) => sum + data.transactions.length, 0);
  const totalAmount = localData.reduce((sum, data) => sum + data.totalAmount, 0);

  // Aggregate category totals across all statements
  const aggregatedCategories: Record<string, number> = {};
  localData.forEach(data => {
    Object.entries(data.categoryTotals).forEach(([category, amount]) => {
      aggregatedCategories[category] = (aggregatedCategories[category] || 0) + amount;
    });
  });

  const availableCategories = STANDARD_CATEGORIES;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      'Shopping & E-commerce': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      'Transportation': 'bg-green-500/10 text-green-700 dark:text-green-400',
      'Utilities & Bills': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      'Entertainment & Subscriptions': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
      'Healthcare': 'bg-red-500/10 text-red-700 dark:text-red-400',
      'Education': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
      'Groceries': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
      'Financial Services': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      'Other': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            extraction complete
          </h2>
        </div>
        <p className="text-muted-foreground font-sans">
          review your transactions before submitting for analysis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm font-sans text-muted-foreground mb-1">total statements</p>
          <p className="text-2xl font-heading font-bold text-foreground tabular-nums">{extractedData.length}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm font-sans text-muted-foreground mb-1">total transactions</p>
          <p className="text-2xl font-heading font-bold text-foreground tabular-nums">{totalTransactions}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm font-sans text-muted-foreground mb-1">total amount</p>
          <p className="text-2xl font-heading font-bold text-foreground tabular-nums">{formatINR(totalAmount)}</p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6 border-border">
        <h3 className="text-lg font-heading font-bold text-foreground mb-4">
          spending by category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(aggregatedCategories)
            .sort(([, a], [, b]) => b - a)
            .map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                </div>
                <p className="text-sm font-sans font-medium text-foreground">{formatINR(amount)}</p>
              </div>
            ))}
        </div>
      </Card>

      {/* File-by-File Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-heading font-bold text-foreground">
          transactions by statement
        </h3>
        {localData.map((data, fileIndex) => (
          <Card key={fileIndex} className="border-border overflow-hidden">
            {/* File Header */}
            <button
              onClick={() => toggleFile(data.fileName)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-sans font-medium text-foreground mb-1">{data.fileName}</p>
                <div className="flex items-center gap-4 text-xs font-sans text-muted-foreground">
                  <span>{data.transactions.length} transactions</span>
                  <span>{data.dateRange.start} - {data.dateRange.end}</span>
                  <span className="font-medium text-foreground">{formatINR(data.totalAmount)}</span>
                </div>
              </div>
              {expandedFiles.has(data.fileName) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {/* Transactions List */}
            {expandedFiles.has(data.fileName) && (
              <div className="border-t border-border">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/30 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-xs font-sans font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 text-xs font-sans font-medium text-muted-foreground">Merchant</th>
                        <th className="text-left p-3 text-xs font-sans font-medium text-muted-foreground">Category</th>
                        <th className="text-center p-3 text-xs font-sans font-medium text-muted-foreground">Type</th>
                        <th className="text-right p-3 text-xs font-sans font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map((tx, txIndex) => {
                        const txType = tx.type || tx.transactionType || 'debit';
                        return (
                          <tr key={txIndex} className="border-t border-border/50 hover:bg-secondary/20">
                            <td className="p-3 text-xs font-sans text-foreground">{tx.date}</td>
                            <td className="p-3 text-xs font-sans text-foreground">{tx.merchant}</td>
                            <td className="p-3">
                              <Select
                                value={tx.category}
                                onValueChange={(newCategory) => handleCategoryChange(fileIndex, txIndex, newCategory)}
                              >
                                <SelectTrigger className="h-6 text-xs border-0 bg-transparent focus:ring-0">
                                  <Badge className={`text-xs ${getCategoryColor(tx.category)}`}>
                                    <SelectValue />
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map(cat => (
                                    <SelectItem key={cat} value={cat} className="text-xs">
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-center">
                              {txType === 'credit' ? (
                                <ArrowUpCircle className="h-4 w-4 text-green-500 inline-block" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-orange-500 inline-block" />
                              )}
                            </td>
                            <td className={`p-3 text-xs font-sans text-right font-medium ${
                              txType === 'credit' ? 'text-green-600 dark:text-green-500' : 'text-foreground'
                            }`}>
                              {formatINR(tx.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-foreground/20 hover:bg-foreground/5"
        >
          Cancel & Start Over
        </Button>
        <Button
          onClick={() => {
            // Validate all transactions have categories
            const allHaveCategories = localData.every(ed => 
              ed.transactions.every(t => t.category && t.category.length > 0)
            );
            
            const allHaveTypes = localData.every(ed =>
              ed.transactions.every(t => t.transactionType === 'debit' || t.transactionType === 'credit')
            );
            
            console.log('[TransactionReview] Submitting edited data:', {
              totalTransactions: localData.reduce((sum, ed) => sum + ed.transactions.length, 0),
              filesCount: localData.length,
              allHaveCategories,
              allHaveTypes,
              sampleTransaction: localData[0]?.transactions[0]
            });
            
            if (!allHaveCategories) {
              console.warn('[TransactionReview] Some transactions missing categories');
            }
            
            if (!allHaveTypes) {
              console.warn('[TransactionReview] Some transactions missing type');
            }
            
            onSubmit(localData);
          }}
          className="flex-1"
        >
          Submit for AI Analysis
        </Button>
      </div>
    </div>
  );
}
