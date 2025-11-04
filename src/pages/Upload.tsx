import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileText, Loader2, LogOut, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInputModal } from "@/components/PasswordInputModal";
import { TransactionReview, ExtractedData } from "@/components/TransactionReview";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/onboarding/SegmentedControl";
import { checkPDFEncryption, decryptAndExtractPDF, analyzeTransactions } from "@/lib/pdfProcessor";
type FileStatus = 'selected' | 'checking' | 'encrypted' | 'decrypting' | 'processing' | 'success' | 'error';
interface FileWithStatus {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}
const Upload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);
  const [encryptedFiles, setEncryptedFiles] = useState<File[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'bank' | 'credit' | 'mixed' | null>(null);
  const [hasRecentAnalysis, setHasRecentAnalysis] = useState(false);
  const [recentAnalysisId, setRecentAnalysisId] = useState<string | null>(null);
  useEffect(() => {
    const initUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };
    initUser();

    // Listen for sign-out only
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth", {
          replace: true
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Read mode from URL query params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'bank' || modeParam === 'credit' || modeParam === 'mixed') {
      setMode(modeParam);
    } else if (user) {
      // No mode specified - check localStorage for saved choice
      const saved = localStorage.getItem(`first_card_choice_${user.id}`);
      if (saved === 'bank' || saved === 'credit') {
        setMode(saved);
      } else {
        // Fallback: show inline chooser
        setMode(null);
      }
    }
  }, [location.search, user]);

  useEffect(() => {
    const checkRecentAnalysis = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('spending_analyses')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        const analysisDate = new Date(data.created_at);
        const daysSince = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince < 7) {
          setHasRecentAnalysis(true);
          setRecentAnalysisId(data.id);
        }
      }
    };
    
    checkRecentAnalysis();
  }, [user]);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Validate file types - only PDFs
      const invalidFiles = selectedFiles.filter(file => !file.type.includes('pdf') && !file.name.endsWith('.pdf'));
      if (invalidFiles.length > 0) {
        toast.error('Please upload only PDF files');
        return;
      }
      if (selectedFiles.length > 3) {
        toast.error('Please upload a maximum of 3 statement files');
        return;
      }

      // Gentle validation nudges based on mode
      if (mode === 'bank' && selectedFiles.length < 2) {
        toast.info('Tip: Upload 2-3 months of statements for better recommendations', {
          duration: 4000
        });
      }
      if (mode === 'credit' && selectedFiles.length === 1) {
        toast.info('Have more cards? Add their statements too for accurate savings estimates', {
          duration: 4000
        });
      }

      // Initialize files with status
      const filesWithInitialStatus: FileWithStatus[] = selectedFiles.map(file => ({
        file,
        status: 'selected' as FileStatus,
        progress: 0
      }));
      setFilesWithStatus(filesWithInitialStatus);
      toast.success(`${selectedFiles.length} PDF file(s) selected`);

      // Check for encryption
      await checkFilesForEncryption(selectedFiles);
    }
  };
  const checkFilesForEncryption = async (files: File[]) => {
    setFilesWithStatus(prev => prev.map(f => ({
      ...f,
      status: 'checking' as FileStatus
    })));
    const encrypted: File[] = [];
    const nonEncrypted: File[] = [];
    for (const file of files) {
      try {
        const result = await checkPDFEncryption(file);
        if (result.needsPassword) {
          encrypted.push(file);
          setFilesWithStatus(prev => prev.map(f => f.file.name === file.name ? {
            ...f,
            status: 'encrypted' as FileStatus
          } : f));
        } else {
          nonEncrypted.push(file);
          setFilesWithStatus(prev => prev.map(f => f.file.name === file.name ? {
            ...f,
            status: 'selected' as FileStatus
          } : f));
        }
      } catch (error) {
        console.error(`Error checking ${file.name}:`, error);
        setFilesWithStatus(prev => prev.map(f => f.file.name === file.name ? {
          ...f,
          status: 'error' as FileStatus,
          error: 'Failed to check encryption'
        } : f));
      }
    }

    // If there are non-encrypted files, process them immediately
    if (nonEncrypted.length > 0 && encrypted.length === 0) {
      // All files are non-encrypted, process them directly
      const emptyPasswords = new Map<string, string>();
      await processAllFiles(emptyPasswords);
    } else if (encrypted.length > 0) {
      // Some files are encrypted, show password modal
      setEncryptedFiles(encrypted);
      setShowPasswordModal(true);
    }
  };
  const handlePasswordSubmit = async (passwords: Map<string, string>) => {
    setShowPasswordModal(false);
    setProcessing(true);
    try {
      await processAllFiles(passwords);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    } finally {
      setProcessing(false);
    }
  };
  const processAllFiles = async (passwords: Map<string, string>) => {
    const allExtractedData: ExtractedData[] = [];
    let completed = 0;
    const total = filesWithStatus.length;

    // PHASE 2: Enhanced error messages with HTTP status awareness
    const getErrorMessage = (error: any, extractData?: any): string => {
      // Check for structured error response from edge function
      if (extractData?.error) return extractData.error;
      
      // Check for HTTP status codes
      if (error.status === 401) return 'Authentication failed. Please log in again.';
      if (error.status === 402) return 'AI service credits exhausted. Please contact support.';
      if (error.status === 429) return 'Too many requests. Please wait 30 seconds and try again.';
      if (error.status === 503) return 'AI service temporarily unavailable. Please try again in a few minutes.';
      
      // Fallback to error message
      return error.message || 'Failed to extract transactions';
    };

    const getErrorSuggestion = (error: any, extractData?: any): string => {
      if (extractData?.suggestion) return extractData.suggestion;
      
      if (error.status === 401) return 'Please refresh the page and log in again.';
      if (error.status === 402) return 'Top up your account or contact support@example.com';
      if (error.status === 429) return 'Wait 30 seconds before uploading more statements.';
      if (error.status === 503) return 'Our AI service is under high load. Try again in a few minutes.';
      
      return 'Ensure the PDF is a valid bank/credit card statement. Try re-downloading from your bank.';
    };

    for (const fileWithStatus of filesWithStatus) {
      const { file, status } = fileWithStatus;

      if (status === 'error') {
        completed++;
        continue;
      }

      const password = passwords.get(file.name);
      const isEncrypted = status === 'encrypted';

      setFilesWithStatus(prev => prev.map(f => 
        f.file.name === file.name ? {
          ...f,
          status: isEncrypted ? 'decrypting' as FileStatus : 'processing' as FileStatus,
          progress: 0
        } : f
      ));

      // Step 1: Extract PDF text (30% progress)
      const result = await decryptAndExtractPDF(file, password, progress => {
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, progress: progress * 0.3 } : f
        ));
      });

      if (!result.success) {
        const errorMessage = result.error || 'Failed to read PDF';
        const suggestion = getErrorSuggestion({ message: errorMessage });
        
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? {
            ...f,
            status: 'error' as FileStatus,
            error: errorMessage
          } : f
        ));
        toast.error(`${file.name}: ${errorMessage}`, {
          description: suggestion,
          duration: 6000
        });
        completed++;
        continue;
      }

      // Step 2: AI-powered extraction (40% → 100% progress)
      setFilesWithStatus(prev => prev.map(f => 
        f.file.name === file.name ? {
          ...f,
          status: 'processing' as FileStatus,
          progress: 40
        } : f
      ));

      try {
        const extractionStart = Date.now();
        const { data: extractData, error: extractError } = await supabase.functions.invoke(
          'extract-transactions',
          {
            body: {
              pdfText: result.text,
              fileName: file.name,
              statementType: mode === 'bank' ? 'bank' : mode === 'credit' ? 'credit_card' : 'unknown'
            }
          }
        );

        // PHASE 2: Better error handling with specific messages
        if (extractError) {
          const errorMessage = getErrorMessage(extractError, extractData);
          const suggestion = getErrorSuggestion(extractError, extractData);
          
          console.error('[http-error]', { 
            status: extractError.status, 
            message: extractError.message,
            fileName: file.name 
          });
          
          throw new Error(errorMessage);
        }
        
        if (!extractData.success) {
          const errorMessage = extractData.error || 'Extraction failed';
          const suggestion = extractData.suggestion || getErrorSuggestion({}, extractData);
          
          console.error('[extraction-failed]', { 
            fileName: file.name,
            error: errorMessage,
            metadata: extractData.metadata 
          });
          
          setFilesWithStatus(prev => prev.map(f => 
            f.file.name === file.name ? {
              ...f,
              status: 'error' as FileStatus,
              error: errorMessage
            } : f
          ));
          
          toast.error(`${file.name}: ${errorMessage}`, {
            description: suggestion,
            duration: 6000
          });
          
          completed++;
          setOverallProgress((completed / total) * 100);
          continue;
        }

        const { transactions, metadata } = extractData;

        if (!transactions || transactions.length === 0) {
          throw new Error('No transactions found. The statement may be empty or in an unsupported format.');
        }

        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, progress: 70 } : f
        ));

        // Calculate totals for UI
        const totalAmount = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        const categoryTotals: Record<string, number> = {};
        transactions.forEach((t: any) => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        allExtractedData.push({
          fileName: file.name,
          transactions,
          totalAmount,
          dateRange: {
            start: metadata.dateRangeStart,
            end: metadata.dateRangeEnd
          },
          categoryTotals
        });

        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? {
            ...f,
            status: 'success' as FileStatus,
            progress: 100
          } : f
        ));

        const processingTime = Date.now() - extractionStart;
        
        // PHASE 2: Show extraction metadata to users
        console.log('[extraction-success]', {
          fileName: file.name,
          method: 'ai_powered',
          transactionsFound: transactions.length,
          processingTimeMs: processingTime,
          detectedFormat: metadata.detectedFormat,
          duplicatesRemoved: metadata.duplicatesRemoved || 0,
          success: true
        });

        // Show format info in toast if available
        const formatInfo = metadata.detectedFormat && metadata.detectedFormat !== 'Unknown Format' 
          ? ` (${metadata.detectedFormat})` 
          : '';
        toast.success(`✓ ${file.name}${formatInfo}`, {
          description: `${transactions.length} transactions extracted in ${Math.round(processingTime / 1000)}s`
        });

      } catch (error: any) {
        const errorMessage = error.message || 'Failed to extract transactions';
        const suggestion = getErrorSuggestion(error);
        
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? {
            ...f,
            status: 'error' as FileStatus,
            error: errorMessage
          } : f
        ));

        console.error('[extraction-error]', {
          fileName: file.name,
          error: errorMessage,
          status: error.status,
          method: 'ai_powered'
        });

        toast.error(`${file.name}: ${errorMessage}`, {
          description: suggestion,
          duration: 6000
        });
      }

      completed++;
      setOverallProgress((completed / total) * 100);
    }

    if (allExtractedData.length > 0) {
      setExtractedData(allExtractedData);
      setShowReview(true);
      toast.success(`Successfully processed ${allExtractedData.length} of ${total} statements!`, {
        description: `${allExtractedData.reduce((sum, d) => sum + d.transactions.length, 0)} transactions extracted`
      });
    } else {
      toast.error('Failed to process any statements', {
        description: 'Please check that your files are valid bank/credit card statements and try again.'
      });
    }
  };
  const handleSubmitForAnalysis = async (editedData: ExtractedData[]) => {
    if (!user) {
      toast.error('Please sign in first');
      navigate("/auth");
      return;
    }
    
    console.log('[Upload] Calling analyze-statements with edited data:', {
      totalTransactions: editedData.reduce((sum, ed) => sum + ed.transactions.length, 0),
      filesCount: editedData.length,
      sampleTransaction: editedData[0]?.transactions[0]
    });
    
    setShowReview(false);
    setProcessing(true);
    try {
      // Call the analysis function with EDITED data (preserving user changes)
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-statements', {
        body: {
          extractedData: editedData.map(ed => ({
            fileName: ed.fileName,
            transactions: ed.transactions.map(t => ({
              date: t.date,
              merchant: t.merchant,
              amount: t.amount,
              category: t.category || "Other",
              transactionType: t.transactionType || t.type || "debit"
            })),
            totalAmount: ed.totalAmount,
            dateRange: ed.dateRange,
            categoryTotals: ed.categoryTotals
          }))
        }
      });
      if (error) {
        console.error('Analysis error details:', error);
        toast.error(`Failed to analyze statements: ${error.message || 'Unknown error'}`, {
          description: "Please try again or contact support if the issue persists.",
          duration: 6000
        });
        setProcessing(false);
        return;
      }
      if (!data?.analysis?.id) {
        console.error('No analysis ID returned:', data);
        toast.error('Analysis completed but failed to save results');
        setProcessing(false);
        return;
      }
      toast.success('Analysis complete!');
      navigate(`/results?analysisId=${data.analysis.id}`, {
        state: {
          analysisId: data.analysis.id
        }
      });
    } catch (error: any) {
      console.error('Unexpected error during analysis:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`, {
        description: "Please check the console for details and try again.",
        duration: 6000
      });
      setProcessing(false);
    }
  };
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'selected':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'encrypted':
        return <Lock className="h-5 w-5 text-amber-500" />;
      case 'decrypting':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };
  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case 'selected':
        return 'ready';
      case 'checking':
        return 'checking encryption...';
      case 'encrypted':
        return 'password required';
      case 'decrypting':
        return 'decrypting PDF...';
      case 'processing':
        return 'extracting with AI...';
      case 'success':
        return 'processed';
      case 'error':
        return 'error';
      default:
        return 'unknown';
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  if (showReview) {
    return <div className="min-h-screen bg-background">
        <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-6 lg:px-12 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                card & carry.
              </h1>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-foreground/20 hover:bg-foreground/5">
                <LogOut className="h-4 w-4 mr-2" />
                sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <TransactionReview extractedData={extractedData} onSubmit={handleSubmitForAnalysis} onCancel={() => {
            setShowReview(false);
            setFilesWithStatus([]);
            setExtractedData([]);
          }} />
          </div>
        </main>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              card & carry.
            </h1>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-foreground/20 hover:bg-foreground/5">
              <LogOut className="h-4 w-4 mr-2" />
              sign out
            </Button>
          </div>
        </div>
      </header>

        <main className="container mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              {mode === "bank" && "upload bank statements (last 3 months)"}
              {mode === "credit" && "upload your latest credit card statements (all cards)"}
              {mode === "mixed" && "upload statements"}
              {!mode && "upload your statements"}
            </h2>
            <p className="text-lg font-sans text-muted-foreground">
              {mode === 'bank' && "PDF/CSV from your salary/spend account. If the file is password-protected, we'll ask for it."}
              {mode === 'credit' && 'PDF/CSV. Add a statement for each card you use so we can estimate savings accurately.'}
              {mode === 'mixed' && 'You can add bank and card statements—use whatever you have handy.'}
              {!mode && 'Upload up to 3 months of PDF bank or credit card statements'}
            </p>
          </div>

          {/* Recent Analysis Alert */}
          {hasRecentAnalysis && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have a recent analysis. 
                <Button 
                  variant="link" 
                  className="px-2 h-auto py-0" 
                  onClick={() => navigate(`/results?analysisId=${recentAnalysisId}`)}
                >
                  Continue where you left off
                </Button>
                or upload new statements below.
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8 md:p-12 border-border">
            <div className="space-y-8">
              {/* Inline mode chooser if no mode specified */}
              {!mode && <div className="mb-6 p-4 border border-border rounded-lg bg-card">
                  <Label className="text-sm font-medium mb-3 block">
                    What type of statements will you upload?
                  </Label>
                  <SegmentedControl name="upload-mode" options={[{
                value: "bank",
                label: "Bank statements"
              }, {
                value: "credit",
                label: "Credit card statements"
              }]} value="" onValueChange={value => {
                setMode(value as 'bank' | 'credit');
                if (user) {
                  localStorage.setItem(`first_card_choice_${user.id}`, value);
                }
              }} />
                </div>}
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                <input type="file" id="file-upload" multiple accept=".pdf" onChange={handleFileChange} className="hidden" disabled={processing} />
                <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center gap-4 ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="bg-primary/10 p-4 rounded-full">
                    <UploadIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-sans text-foreground mb-2">
                      click to upload or drag and drop
                    </p>
                    <p className="text-sm font-sans text-muted-foreground">
                      PDF files only (max 3 files)
                    </p>
                  </div>
                </label>
              </div>

              {filesWithStatus.length > 0 && <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-sans font-medium text-foreground">
                      selected files:
                    </p>
                    {processing && <p className="text-sm font-sans text-muted-foreground">
                        processing {filesWithStatus.filter(f => f.status === 'success').length} of {filesWithStatus.length}
                      </p>}
                  </div>
                  
                  {filesWithStatus.map((fileWithStatus, index) => <div key={index} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                        {getStatusIcon(fileWithStatus.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans text-foreground truncate">
                            {fileWithStatus.file.name}
                          </p>
                          <p className="text-xs font-sans text-muted-foreground">
                            {getStatusText(fileWithStatus.status)}
                            {fileWithStatus.error && ` - ${fileWithStatus.error}`}
                          </p>
                        </div>
                        <span className="text-xs font-sans text-muted-foreground whitespace-nowrap">
                          {(fileWithStatus.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      
                      {(fileWithStatus.status === 'decrypting' || fileWithStatus.status === 'processing') && <Progress value={fileWithStatus.progress} className="h-1" />}
                    </div>)}

                  {processing && overallProgress > 0 && <div className="pt-4">
                      <div className="flex justify-between text-sm font-sans text-muted-foreground mb-2">
                        <span>overall progress</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>}
                </div>}

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="font-sans text-foreground text-sm">
                  <Lock className="h-4 w-4 inline mr-2 text-primary" />
                  <strong>Privacy First:</strong> Your statements are processed entirely in your browser. 
                  Passwords and files never leave your device until you submit.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <PasswordInputModal open={showPasswordModal} encryptedFiles={encryptedFiles} onSubmit={handlePasswordSubmit} onCancel={() => {
      setShowPasswordModal(false);
      setFilesWithStatus([]);
      setEncryptedFiles([]);
    }} />
    </div>;
};
export default Upload;