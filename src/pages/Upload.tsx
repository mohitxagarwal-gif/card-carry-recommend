import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, Loader2, LogOut, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PasswordInputModal } from "@/components/PasswordInputModal";
import { TransactionReview, ExtractedData } from "@/components/TransactionReview";
import { Progress } from "@/components/ui/progress";
import { checkPDFEncryption, decryptAndExtractPDF, extractTransactions, analyzeTransactions } from "@/lib/pdfProcessor";

type FileStatus = 'selected' | 'checking' | 'encrypted' | 'decrypting' | 'processing' | 'success' | 'error';

interface FileWithStatus {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);
  const [encryptedFiles, setEncryptedFiles] = useState<File[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

      // Initialize files with status
      const filesWithInitialStatus: FileWithStatus[] = selectedFiles.map(file => ({
        file,
        status: 'selected' as FileStatus,
        progress: 0,
      }));
      
      setFilesWithStatus(filesWithInitialStatus);
      toast.success(`${selectedFiles.length} PDF file(s) selected`);

      // Check for encryption
      await checkFilesForEncryption(selectedFiles);
    }
  };

  const checkFilesForEncryption = async (files: File[]) => {
    setFilesWithStatus(prev => prev.map(f => ({ ...f, status: 'checking' as FileStatus })));
    
    const encrypted: File[] = [];
    const nonEncrypted: File[] = [];
    
    for (const file of files) {
      try {
        const result = await checkPDFEncryption(file);
        
        if (result.needsPassword) {
          encrypted.push(file);
          setFilesWithStatus(prev => prev.map(f => 
            f.file.name === file.name ? { ...f, status: 'encrypted' as FileStatus } : f
          ));
        } else {
          nonEncrypted.push(file);
          setFilesWithStatus(prev => prev.map(f => 
            f.file.name === file.name ? { ...f, status: 'selected' as FileStatus } : f
          ));
        }
      } catch (error) {
        console.error(`Error checking ${file.name}:`, error);
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, status: 'error' as FileStatus, error: 'Failed to check encryption' } : f
        ));
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

    for (const fileWithStatus of filesWithStatus) {
      const { file, status } = fileWithStatus;
      
      // Skip files that are already in error state
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

      const result = await decryptAndExtractPDF(file, password, (progress) => {
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, progress } : f
        ));
      });

      if (!result.success) {
        const errorMessage = result.error || 'Unknown error';
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { 
            ...f, 
            status: 'error' as FileStatus, 
            error: errorMessage 
          } : f
        ));
        toast.error(`Failed to process ${file.name}: ${errorMessage}`, {
          description: "Check the password and try again, or re-upload the file.",
          duration: 5000,
        });
        completed++;
        continue;
      }

      setFilesWithStatus(prev => prev.map(f => 
        f.file.name === file.name ? { ...f, status: 'processing' as FileStatus } : f
      ));

      try {
        // Extract transactions
        const transactions = extractTransactions(result.text, file.name);
        
        if (transactions.length === 0) {
          throw new Error('No transactions found in statement');
        }

        const analysis = analyzeTransactions(transactions);

        allExtractedData.push({
          fileName: file.name,
          transactions,
          ...analysis,
        });

        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, status: 'success' as FileStatus, progress: 100 } : f
        ));
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to extract transactions';
        setFilesWithStatus(prev => prev.map(f => 
          f.file.name === file.name ? { 
            ...f, 
            status: 'error' as FileStatus, 
            error: errorMessage 
          } : f
        ));
        toast.error(`Failed to analyze ${file.name}: ${errorMessage}`, {
          description: "The statement format may not be supported.",
          duration: 5000,
        });
      }

      completed++;
      setOverallProgress((completed / total) * 100);
    }

    if (allExtractedData.length > 0) {
      setExtractedData(allExtractedData);
      setShowReview(true);
      toast.success(`Successfully processed ${allExtractedData.length} of ${total} statements!`);
    } else {
      toast.error('Failed to process any statements. Please check your files and try again.');
    }
  };

  const handleSubmitForAnalysis = async () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate("/auth");
      return;
    }

    setShowReview(false);
    setProcessing(true);

    try {
      // Call the analysis function with extracted data
      const { data, error } = await supabase.functions.invoke('analyze-statements', {
        body: { 
          extractedData: extractedData.map(ed => ({
            fileName: ed.fileName,
            transactions: ed.transactions,
            totalAmount: ed.totalAmount,
            dateRange: ed.dateRange,
            categoryTotals: ed.categoryTotals,
          }))
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze statements. Please try again.');
        return;
      }

      toast.success('Analysis complete!');
      navigate('/results', { state: { analysisId: data.analysis.id } });

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
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
        return 'decrypting...';
      case 'processing':
        return 'extracting data...';
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
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-6 lg:px-12 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-playfair italic font-medium text-foreground">
                card & carry.
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-foreground/20 hover:bg-foreground/5"
              >
                <LogOut className="h-4 w-4 mr-2" />
                sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <TransactionReview
              extractedData={extractedData}
              onSubmit={handleSubmitForAnalysis}
              onCancel={() => {
                setShowReview(false);
                setFilesWithStatus([]);
                setExtractedData([]);
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-playfair italic font-medium text-foreground">
              card & carry.
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-foreground/20 hover:bg-foreground/5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-playfair italic font-medium text-foreground mb-4">
              upload your statements
            </h2>
            <p className="text-lg font-sans text-muted-foreground">
              upload up to 3 months of PDF bank or credit card statements
            </p>
          </div>

          <Card className="p-8 md:p-12 border-border">
            <div className="space-y-8">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={processing}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center gap-4 ${processing ? 'opacity-50 pointer-events-none' : ''}`}
                >
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

              {filesWithStatus.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-sans font-medium text-foreground">
                      selected files:
                    </p>
                    {processing && (
                      <p className="text-sm font-sans text-muted-foreground">
                        processing {filesWithStatus.filter(f => f.status === 'success').length} of {filesWithStatus.length}
                      </p>
                    )}
                  </div>
                  
                  {filesWithStatus.map((fileWithStatus, index) => (
                    <div key={index} className="space-y-2">
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
                      
                      {(fileWithStatus.status === 'decrypting' || fileWithStatus.status === 'processing') && (
                        <Progress value={fileWithStatus.progress} className="h-1" />
                      )}
                    </div>
                  ))}

                  {processing && overallProgress > 0 && (
                    <div className="pt-4">
                      <div className="flex justify-between text-sm font-sans text-muted-foreground mb-2">
                        <span>overall progress</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-sans text-foreground">
                  <Lock className="h-4 w-4 inline mr-2 text-primary" />
                  <strong>Privacy First:</strong> Your statements are processed entirely in your browser. 
                  Passwords and files never leave your device until you submit.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <PasswordInputModal
        open={showPasswordModal}
        encryptedFiles={encryptedFiles}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordModal(false);
          setFilesWithStatus([]);
          setEncryptedFiles([]);
        }}
      />
    </div>
  );
};

export default Upload;
