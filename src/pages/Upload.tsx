import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate file types
      const validTypes = ['text/plain', 'text/csv', 'application/pdf', 'application/vnd.ms-excel'];
      const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type) && !file.name.endsWith('.csv'));
      
      if (invalidFiles.length > 0) {
        toast.error('Please upload only PDF, CSV, or TXT files');
        return;
      }

      if (selectedFiles.length > 3) {
        toast.error('Please upload a maximum of 3 statement files');
        return;
      }

      setFiles(selectedFiles);
      toast.success(`${selectedFiles.length} file(s) selected`);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one statement file');
      return;
    }

    if (!user) {
      toast.error('Please sign in first');
      navigate("/auth");
      return;
    }

    setUploading(true);

    try {
      // Upload files to storage
      const uploadedPaths = [];
      
      for (const file of files) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('statements')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        uploadedPaths.push(filePath);
      }

      if (uploadedPaths.length === 0) {
        toast.error('No files were uploaded successfully');
        return;
      }

      toast.success('Files uploaded successfully! Starting analysis...');
      setUploading(false);
      setAnalyzing(true);

      // Call the analysis function
      const { data, error } = await supabase.functions.invoke('analyze-statements', {
        body: { statementPaths: uploadedPaths }
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
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
              upload up to 3 months of bank or credit card statements for analysis
            </p>
          </div>

          <Card className="p-8 md:p-12 border-border">
            <div className="space-y-8">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="bg-primary/10 p-4 rounded-full">
                    <UploadIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-sans text-foreground mb-2">
                      click to upload or drag and drop
                    </p>
                    <p className="text-sm font-sans text-muted-foreground">
                      PDF, CSV, or TXT files (max 3 files)
                    </p>
                  </div>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-sans font-medium text-foreground">
                    selected files:
                  </p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-sans text-foreground flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs font-sans text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleUploadAndAnalyze}
                disabled={files.length === 0 || uploading || analyzing}
                className="w-full font-sans py-6 text-base"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    uploading files...
                  </>
                ) : analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    analyzing spending patterns...
                  </>
                ) : (
                  'upload & analyze'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Upload;
