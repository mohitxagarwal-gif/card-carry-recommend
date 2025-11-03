import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from '@/components/TransactionReview';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface PDFProcessingResult {
  isEncrypted: boolean;
  needsPassword: boolean;
}

// Format amount in Indian Rupees with proper formatting
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function checkPDFEncryption(file: File): Promise<PDFProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    try {
      const pdf = await loadingTask.promise;
      // Successfully loaded without password - not encrypted
      return { isEncrypted: false, needsPassword: false };
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        // Password required
        return { isEncrypted: true, needsPassword: true };
      }
      // Other errors
      console.error('PDF loading error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error checking PDF encryption:', error);
    throw new Error(`Failed to check PDF encryption: ${error}`);
  }
}

export async function decryptAndExtractPDF(
  file: File,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || undefined,
    });

    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        return { text: '', success: false, error: 'Incorrect password' };
      }
      throw error;
    }

    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
      
      if (onProgress) {
        onProgress((i / numPages) * 100);
      }
    }

    return { text: fullText, success: true };
  } catch (error) {
    console.error('Error processing PDF:', error);
    return { text: '', success: false, error: String(error) };
  }
}

// DEPRECATED: This regex-based extraction has been replaced by AI-powered extraction
// via the extract-transactions edge function. Keeping for reference/emergency fallback.
// 
// export function extractTransactions(text: string, fileName: string): Transaction[] {
//   const transactions: Transaction[] = [];
//   const lines = text.split('\n').filter(line => line.trim());
//
//   // Common date patterns
//   const datePatterns = [
//     /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, // MM/DD/YYYY or DD/MM/YYYY
//     /(\d{1,2}-\d{1,2}-\d{2,4})/g,   // MM-DD-YYYY or DD-MM-YYYY
//     /(\d{4}-\d{1,2}-\d{1,2})/g,     // YYYY-MM-DD
//   ];
//
//   // Amount pattern (with optional currency symbol)
//   const amountPattern = /[\$]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
//
//   // Indian merchant keywords for categorization
//   const categories: Record<string, string[]> = {
//     'Food & Dining': [
//       'swiggy', 'zomato', 'uber eats', 'dominos', 'pizza hut', 'mcdonald', 'kfc', 'subway',
//       'cafe coffee day', 'starbucks', 'burger king', 'haldiram', 'barbeque nation',
//       'restaurant', 'cafe', 'dhaba', 'biryani', 'thali'
//     ],
//     'Shopping & E-commerce': [
//       'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'snapdeal',
//       'reliance', 'big bazaar', 'dmart', 'more megastore', 'hypercity', 'star bazaar',
//       'lifestyle', 'westside', 'pantaloons', 'max fashion', 'mall', 'store', 'shop'
//     ],
//     'Transportation': [
//       'uber', 'ola', 'rapido', 'metro', 'irctc', 'redbus', 'goibibo', 'makemytrip',
//       'indian oil', 'bharat petroleum', 'hp petrol', 'shell', 'essar',
//       'fastag', 'toll', 'parking'
//     ],
//     'Utilities & Bills': [
//       'airtel', 'jio', 'vodafone', 'idea', 'bsnl', 'tata sky', 'dish tv',
//       'electricity', 'water', 'gas', 'lpg', 'cylinder',
//       'broadband', 'wifi', 'internet', 'postpaid', 'prepaid'
//     ],
//     'Entertainment & Subscriptions': [
//       'netflix', 'amazon prime', 'hotstar', 'disney', 'zee5', 'sonyliv', 'voot',
//       'spotify', 'gaana', 'wynk', 'jiosaavn',
//       'bookmyshow', 'paytm insider', 'pvr', 'inox', 'movie', 'cinema'
//     ],
//     'Healthcare': [
//       'apollo', 'fortis', 'max hospital', 'manipal', 'medanta',
//       'pharmacy', 'medical', 'doctor', 'clinic', 'diagnostic',
//       'apollo pharmacy', 'medplus', 'netmeds', '1mg', 'pharmeasy'
//     ],
//     'Education': [
//       'byju', 'unacademy', 'vedantu', 'upgrad', 'coursera', 'udemy',
//       'school', 'college', 'university', 'tuition', 'coaching'
//     ],
//     'Groceries': [
//       'bigbasket', 'grofers', 'blinkit', 'dunzo', 'milk basket', 'jiomart',
//       'dmart', 'reliance fresh', 'more', 'spencer', 'nature basket',
//       'grocery', 'supermarket', 'kirana'
//     ],
//     'Financial Services': [
//       'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'paytm', 'phonepe', 'google pay',
//       'insurance', 'lic', 'policy', 'mutual fund', 'sip', 'investment'
//     ],
//   };
//
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     
//     // Try to find date
//     let date = '';
//     for (const pattern of datePatterns) {
//       const dateMatch = line.match(pattern);
//       if (dateMatch) {
//         date = dateMatch[0];
//         break;
//       }
//     }
//
//     if (!date) continue;
//
//     // Find amounts in the line
//     const amounts = Array.from(line.matchAll(amountPattern))
//       .map(match => parseFloat(match[1].replace(/,/g, '')))
//       .filter(amount => amount > 0);
//
//     if (amounts.length === 0) continue;
//
//     // Extract merchant name (text between date and amount)
//     const dateIndex = line.indexOf(date);
//     const amountIndex = line.lastIndexOf('$');
//     let merchant = line.substring(dateIndex + date.length, amountIndex > dateIndex ? amountIndex : line.length).trim();
//     
//     // Clean up merchant name
//     merchant = merchant.replace(/\s+/g, ' ').substring(0, 50);
//     if (!merchant) merchant = 'Unknown Merchant';
//
//     // Categorize based on merchant name
//     let category = 'Other';
//     const merchantLower = merchant.toLowerCase();
//     for (const [cat, keywords] of Object.entries(categories)) {
//       if (keywords.some(keyword => merchantLower.includes(keyword))) {
//         category = cat;
//         break;
//       }
//     }
//
//     // Use the largest amount found (likely the transaction amount)
//     const amount = Math.max(...amounts);
//
//     transactions.push({
//       date,
//       merchant,
//       amount,
//       category,
//     });
//   }
//
//   return transactions;
// }

export function analyzeTransactions(transactions: Transaction[]) {
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  const dates = transactions
    .map(tx => new Date(tx.date))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const dateRange = dates.length > 0 
    ? {
        start: dates[0].toLocaleDateString(),
        end: dates[dates.length - 1].toLocaleDateString(),
      }
    : { start: 'N/A', end: 'N/A' };

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  return {
    totalAmount,
    dateRange,
    categoryTotals,
  };
}
