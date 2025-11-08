import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, ExternalLink } from "lucide-react";

interface ImageUploadFieldProps {
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  cardId: string;
}

export const ImageUploadField = ({ currentUrl, onUrlChange, cardId }: ImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || "");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${cardId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onUrlChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onUrlChange("");
    toast.success("Image removed");
  };

  return (
    <div className="space-y-4">
      <Label>Card Image</Label>
      
      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/image.jpg or upload below"
          value={previewUrl}
          onChange={(e) => {
            setPreviewUrl(e.target.value);
            onUrlChange(e.target.value);
          }}
        />
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemoveImage}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* File Upload */}
      <div className="flex items-center gap-2">
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <Label
          htmlFor="image-upload"
          className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Label>
        <span className="text-xs text-muted-foreground">Max 2MB, JPG/PNG/WEBP</span>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Preview</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <img
            src={previewUrl}
            alt="Card preview"
            className="w-full max-w-md h-auto rounded-md"
            onError={() => toast.error("Failed to load image")}
          />
        </div>
      )}
    </div>
  );
};
