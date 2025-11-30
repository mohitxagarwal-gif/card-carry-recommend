import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";

interface CardData {
  card_id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  welcome_bonus: string;
  reward_type: string[];
  reward_structure: string;
  key_perks: string[];
  lounge_access: string;
  forex_markup: string;
  forex_markup_pct: number;
  ideal_for: string[];
  downsides: string[];
  category_badges: string[];
  popular_score: number;
  waiver_rule?: string;
  eligibility?: string;
  docs_required?: string;
  tnc_url?: string;
  image_url?: string;
  reward_caps_details?: string;
  detailed_reward_breakdown?: object;
  detailed_benefits?: object;
  earning_examples?: object;
  fine_print?: string;
  insider_tips?: string;
  best_use_cases?: string;
  hidden_fees?: string;
  comparison_notes?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

// Zod schema for validating card data
const CardSchema = z.object({
  card_id: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Card ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(100),
  network: z.string().min(1).max(50),
  annual_fee: z.number().int().min(0).max(1000000),
  welcome_bonus: z.string().max(500),
  reward_type: z.array(z.string().max(100)).min(1).max(10),
  reward_structure: z.string().max(2000),
  key_perks: z.array(z.string().max(200)).min(0).max(20),
  lounge_access: z.string().max(200),
  forex_markup: z.string().max(100),
  forex_markup_pct: z.number().min(0).max(100),
  ideal_for: z.array(z.string().max(100)).min(0).max(10),
  downsides: z.array(z.string().max(200)).min(0).max(10),
  category_badges: z.array(z.string().max(50)).min(0).max(10),
  popular_score: z.number().int().min(0).max(100),
  waiver_rule: z.string().max(500).optional(),
  eligibility: z.string().max(500).optional(),
  docs_required: z.string().max(500).optional(),
  tnc_url: z.string().url().max(500).optional().or(z.literal('')),
  image_url: z.string().url().max(500).optional().or(z.literal('')),
  reward_caps_details: z.string().max(2000).optional(),
  detailed_reward_breakdown: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      throw new Error("Invalid JSON for detailed_reward_breakdown");
    }
  }),
  detailed_benefits: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      throw new Error("Invalid JSON for detailed_benefits");
    }
  }),
  earning_examples: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      throw new Error("Invalid JSON for earning_examples");
    }
  }),
  fine_print: z.string().max(5000).optional(),
  insider_tips: z.string().max(2000).optional(),
  best_use_cases: z.string().max(2000).optional(),
  hidden_fees: z.string().max(2000).optional(),
  comparison_notes: z.string().max(2000).optional(),
});

// Sanitize CSV cells to prevent formula injection
const sanitizeCell = (value: any): any => {
  if (typeof value !== 'string') return value;
  // Strip leading formula characters to prevent CSV injection
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
};

// Sanitize array of strings
const sanitizeArray = (arr: string[]): string[] => {
  return arr.map(item => sanitizeCell(item));
};

const AdminBulkUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [parsedData, setParsedData] = useState<CardData[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imageMatches, setImageMatches] = useState<Map<string, string>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  const onDropCSV = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // File size limit: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "CSV file must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          // Row limit: 1000
          const MAX_ROWS = 1000;
          if (results.data.length > MAX_ROWS) {
            toast({
              title: "Too many rows",
              description: `Maximum ${MAX_ROWS} cards per upload. Please split into multiple files.`,
              variant: "destructive",
            });
            return;
          }

          const validationErrors: string[] = [];
          const validatedData: CardData[] = [];

          results.data.forEach((row: any, index: number) => {
            if (!row.card_id || !row.name) return; // Skip empty rows

            try {
              // Parse and sanitize data
              const parsedRow = {
                card_id: sanitizeCell(row.card_id),
                name: sanitizeCell(row.name),
                issuer: sanitizeCell(row.issuer),
                network: sanitizeCell(row.network),
                annual_fee: parseInt(row.annual_fee) || 0,
                welcome_bonus: sanitizeCell(row.welcome_bonus),
                forex_markup: sanitizeCell(row.forex_markup),
                forex_markup_pct: parseFloat(row.forex_markup_pct) || 0,
                popular_score: parseInt(row.popular_score) || 0,
                reward_structure: sanitizeCell(row.reward_structure),
                lounge_access: sanitizeCell(row.lounge_access),
                reward_type: sanitizeArray(row.reward_type?.split(',').map((s: string) => s.trim()) || []),
                key_perks: sanitizeArray(row.key_perks?.split(',').map((s: string) => s.trim()) || []),
                ideal_for: sanitizeArray(row.ideal_for?.split(',').map((s: string) => s.trim()) || []),
                downsides: sanitizeArray(row.downsides?.split(',').map((s: string) => s.trim()) || []),
                category_badges: sanitizeArray(row.category_badges?.split(',').map((s: string) => s.trim()) || []),
                waiver_rule: row.waiver_rule ? sanitizeCell(row.waiver_rule) : undefined,
                eligibility: row.eligibility ? sanitizeCell(row.eligibility) : undefined,
                docs_required: row.docs_required ? sanitizeCell(row.docs_required) : undefined,
                tnc_url: row.tnc_url || undefined,
                image_url: row.image_url || undefined,
                reward_caps_details: row.reward_caps_details ? sanitizeCell(row.reward_caps_details) : undefined,
                detailed_reward_breakdown: row.detailed_reward_breakdown || undefined,
                detailed_benefits: row.detailed_benefits || undefined,
                earning_examples: row.earning_examples || undefined,
                fine_print: row.fine_print ? sanitizeCell(row.fine_print) : undefined,
                insider_tips: row.insider_tips ? sanitizeCell(row.insider_tips) : undefined,
                best_use_cases: row.best_use_cases ? sanitizeCell(row.best_use_cases) : undefined,
                hidden_fees: row.hidden_fees ? sanitizeCell(row.hidden_fees) : undefined,
                comparison_notes: row.comparison_notes ? sanitizeCell(row.comparison_notes) : undefined,
              };

              // Validate with zod schema
              const validated = CardSchema.parse(parsedRow);
              validatedData.push(validated as CardData);
            } catch (error) {
              if (error instanceof z.ZodError) {
                validationErrors.push(`Row ${index + 2}: ${error.errors[0].message}`);
              } else {
                validationErrors.push(`Row ${index + 2}: Validation failed`);
              }
            }
          });

          if (validationErrors.length > 0 && validatedData.length === 0) {
            toast({
              title: "Validation failed",
              description: `${validationErrors.length} errors found. Check console for details.`,
              variant: "destructive",
            });
            console.error("Validation errors:", validationErrors);
            return;
          }

          setParsedData(validatedData);
          toast({
            title: "CSV parsed successfully",
            description: validationErrors.length > 0 
              ? `${validatedData.length} valid cards, ${validationErrors.length} rows skipped`
              : `${validatedData.length} cards ready to upload`,
          });

          if (validationErrors.length > 0) {
            console.warn("Validation warnings:", validationErrors);
          }
        } catch (error: any) {
          toast({
            title: "Processing error",
            description: error.message,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const onDropImages = (acceptedFiles: File[]) => {
    setImages(acceptedFiles);
    
    // Match images to card IDs
    if (parsedData.length > 0) {
      const cardIds = parsedData.map(card => card.card_id);
      const matches = new Map<string, string>();
      
      acceptedFiles.forEach(file => {
        const matchedId = matchImageToCardId(file.name, cardIds);
        if (matchedId) {
          matches.set(file.name, matchedId);
        }
      });
      
      setImageMatches(matches);
      const matchedCount = matches.size;
      const unmatchedCount = acceptedFiles.length - matchedCount;
      
      toast({
        title: "Images loaded",
        description: `${matchedCount} matched, ${unmatchedCount} unmatched`,
      });
    } else {
      toast({
        title: "Images loaded",
        description: `${acceptedFiles.length} images ready. Upload CSV first to see matches.`,
      });
    }
  };

  // Helper function for fuzzy filename matching
  const matchImageToCardId = (filename: string, cardIds: string[]): string | null => {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    // Try exact match
    if (cardIds.includes(nameWithoutExt)) return nameWithoutExt;
    
    // Normalize and try fuzzy match
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedFilename = normalize(nameWithoutExt);
    
    return cardIds.find(id => normalize(id) === normalizedFilename) || null;
  };

  const { getRootProps: getCSVRootProps, getInputProps: getCSVInputProps, isDragActive: isCSVDragActive } = useDropzone({
    onDrop: onDropCSV,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  });

  const downloadTemplate = () => {
    const template = `card_id,name,issuer,network,annual_fee,welcome_bonus,reward_type,reward_structure,key_perks,lounge_access,forex_markup,forex_markup_pct,ideal_for,downsides,category_badges,popular_score,waiver_rule,eligibility,docs_required,tnc_url,reward_caps_details,detailed_reward_breakdown,detailed_benefits,earning_examples,fine_print,insider_tips,best_use_cases,hidden_fees,comparison_notes
example-card-1,Example Card,Example Bank,Visa,2500,10000 reward points,"Cashback,Rewards",2x on dining and travel,"Lounge access,Travel insurance",Domestic & international,3.5%,3.5,"Travelers,Reward seekers",High fees,"Premium,Travel",8,Waived on 5L spend,Min income 6L/yr,Income proof,https://example.com/tnc,₹5000 per month cap,"{""base_rate"":""1%"",""accelerated"":[{""category"":""Dining"",""rate"":""5%""}]}","{""insurance"":""Travel insurance up to ₹5L""}","{""scenario_1"":{""title"":""Monthly spend"",""earnings"":""2850""}}",Terms apply,Use for international travel,Best for frequent travelers,Late payment fees,Compare with other cards`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const totalSteps = parsedData.length + images.length;
      let completedSteps = 0;

      // Upload images first
      const imageMap = new Map<string, string>();
      for (const image of images) {
        // Use matched card_id if available, otherwise fall back to filename-based matching
        const matchedCardId = imageMatches.get(image.name);
        const cardId = matchedCardId || image.name.split('.')[0];
        
        // Skip if no match found
        if (!matchedCardId && !parsedData.find(c => c.card_id === cardId)) {
          console.warn(`Skipping unmatched image: ${image.name}`);
          continue;
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('card-images')
          .upload(`${cardId}.${image.name.split('.').pop()}`, image, {
            upsert: true,
          });

        if (uploadError) {
          errors.push(`Image upload failed for ${image.name}: ${uploadError.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('card-images')
            .getPublicUrl(uploadData.path);
          imageMap.set(cardId, publicUrl);
        }

        completedSteps++;
        setUploadProgress((completedSteps / totalSteps) * 100);
      }

      // Insert cards with image URLs
      for (const card of parsedData) {
        const imageUrl = imageMap.get(card.card_id) || card.image_url;
        
        const { error: insertError } = await supabase
          .from('credit_cards')
          .insert([{
            card_id: card.card_id,
            name: card.name,
            issuer: card.issuer,
            network: card.network,
            annual_fee: card.annual_fee,
            welcome_bonus: card.welcome_bonus,
            reward_type: card.reward_type,
            reward_structure: card.reward_structure,
            key_perks: card.key_perks,
            lounge_access: card.lounge_access,
            forex_markup: card.forex_markup,
            forex_markup_pct: card.forex_markup_pct,
            ideal_for: card.ideal_for,
            downsides: card.downsides,
            category_badges: card.category_badges,
            popular_score: card.popular_score,
            waiver_rule: card.waiver_rule,
            eligibility: card.eligibility,
            docs_required: card.docs_required,
            tnc_url: card.tnc_url,
            image_url: imageUrl,
            reward_caps_details: card.reward_caps_details || null,
            detailed_reward_breakdown: (card.detailed_reward_breakdown as any) || null,
            detailed_benefits: (card.detailed_benefits as any) || null,
            earning_examples: (card.earning_examples as any) || null,
            fine_print: card.fine_print || null,
            insider_tips: card.insider_tips || null,
            best_use_cases: card.best_use_cases || null,
            hidden_fees: card.hidden_fees || null,
            comparison_notes: card.comparison_notes || null,
          }]);

        if (insertError) {
          errors.push(`Card ${card.card_id}: ${insertError.message}`);
        } else {
          successCount++;
        }

        completedSteps++;
        setUploadProgress((completedSteps / totalSteps) * 100);
      }

      setUploadResult({
        success: successCount,
        failed: parsedData.length - successCount,
        errors,
      });

      if (successCount > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${successCount} cards`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setParsedData([]);
    setImages([]);
    setUploadResult(null);
    setUploadProgress(0);
  };

  // Show loading screen until role verification completes
  if (roleLoading) {
    return <CardLoadingScreen message="Verifying access..." variant="fullPage" />;
  }

  // Don't render admin UI until verified as admin
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Upload Credit Cards</h1>
          <p className="text-muted-foreground">Upload multiple cards at once with CSV and images</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Back to Admin
        </Button>
      </div>

      {!uploadResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Download Template</CardTitle>
              <CardDescription>Download the CSV template to see the required format</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Upload CSV File</CardTitle>
              <CardDescription>Upload a CSV file containing card data</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getCSVRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isCSVDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getCSVInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {parsedData.length > 0 ? (
                  <p className="text-sm">
                    ✓ {parsedData.length} cards loaded. Drop another file to replace.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a CSV file here, or click to select
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>Review the first 5 cards before uploading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Issuer</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Annual Fee</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((card, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{card.card_id}</TableCell>
                          <TableCell>{card.name}</TableCell>
                          <TableCell>{card.issuer}</TableCell>
                          <TableCell>{card.network}</TableCell>
                          <TableCell>₹{card.annual_fee}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    ...and {parsedData.length - 5} more cards
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Upload Images (Optional)</CardTitle>
              <CardDescription>
                Upload images named as {"{card_id}.png"} (e.g., hdfc-regalia-gold.png)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getImageRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isImageDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getImageInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {images.length > 0 ? (
                  <p className="text-sm">
                    ✓ {images.length} images loaded. Drop more to add or replace.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Drag & drop images here, or click to select multiple files
                  </p>
                )}
              </div>
              {images.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium">Image Preview & Matching</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => {
                      const matchedCardId = imageMatches.get(img.name);
                      const isMatched = !!matchedCardId;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`border-2 rounded-lg p-2 ${
                            isMatched 
                              ? 'border-green-500/50 bg-green-500/5' 
                              : 'border-red-500/50 bg-red-500/5'
                          }`}
                        >
                          <img
                            src={URL.createObjectURL(img)}
                            alt={img.name}
                            className="w-full h-24 object-cover rounded border border-border mb-2"
                          />
                          <p className="text-xs truncate font-medium mb-1">{img.name}</p>
                          {isMatched ? (
                            <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              → {matchedCardId}
                            </p>
                          ) : (
                            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              No match
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary */}
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>{imageMatches.size}</strong> of {images.length} images matched to cards.
                      {imageMatches.size < images.length && (
                        <span className="block mt-1 text-muted-foreground">
                          Unmatched images will be skipped during upload. Ensure filenames match card IDs.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 4: Upload</CardTitle>
              <CardDescription>Upload all cards and images to the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploading && (
                <div>
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={parsedData.length === 0 || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {parsedData.length} Cards
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={uploading}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
            <CardDescription>Summary of the bulk upload operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>{uploadResult.success}</strong> cards uploaded successfully
                </AlertDescription>
              </Alert>
              {uploadResult.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{uploadResult.failed}</strong> cards failed
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Errors:</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {uploadResult.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => navigate("/admin")} className="flex-1">
                Go to Admin Panel
              </Button>
              <Button variant="outline" onClick={reset}>
                Upload More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBulkUpload;