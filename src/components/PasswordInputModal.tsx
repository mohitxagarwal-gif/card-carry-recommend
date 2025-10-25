import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EncryptedFile {
  file: File;
  password: string;
  showPassword: boolean;
  error?: string;
}

interface PasswordInputModalProps {
  open: boolean;
  encryptedFiles: File[];
  onSubmit: (passwords: Map<string, string>) => void;
  onCancel: () => void;
}

export const PasswordInputModal = ({ open, encryptedFiles, onSubmit, onCancel }: PasswordInputModalProps) => {
  const [filePasswords, setFilePasswords] = useState<Map<string, EncryptedFile>>(
    new Map(encryptedFiles.map(file => [file.name, { file, password: "", showPassword: false }]))
  );
  const [useSamePassword, setUseSamePassword] = useState(false);
  const [commonPassword, setCommonPassword] = useState("");
  const [showCommonPassword, setShowCommonPassword] = useState(false);

  const handlePasswordChange = (fileName: string, password: string) => {
    setFilePasswords(prev => {
      const updated = new Map(prev);
      const fileData = updated.get(fileName)!;
      updated.set(fileName, { ...fileData, password, error: undefined });
      return updated;
    });
  };

  const toggleShowPassword = (fileName: string) => {
    setFilePasswords(prev => {
      const updated = new Map(prev);
      const fileData = updated.get(fileName)!;
      updated.set(fileName, { ...fileData, showPassword: !fileData.showPassword });
      return updated;
    });
  };

  const handleSubmit = () => {
    const passwords = new Map<string, string>();
    
    if (useSamePassword) {
      if (!commonPassword) {
        return;
      }
      encryptedFiles.forEach(file => {
        passwords.set(file.name, commonPassword);
      });
    } else {
      let hasError = false;
      filePasswords.forEach((data, fileName) => {
        if (!data.password) {
          hasError = true;
        } else {
          passwords.set(fileName, data.password);
        }
      });
      
      if (hasError) {
        return;
      }
    }
    
    onSubmit(passwords);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-playfair italic">
            <Lock className="h-5 w-5 text-primary" />
            password-protected statements detected
          </DialogTitle>
          <DialogDescription className="font-sans">
            {encryptedFiles.length} {encryptedFiles.length === 1 ? 'file is' : 'files are'} password-protected. 
            Please enter the password(s) to decrypt them in your browser.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm font-sans">
            <strong>Privacy First:</strong> Your statements are processed entirely in your browser. 
            Passwords and files never leave your device.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="same-password" 
              checked={useSamePassword}
              onCheckedChange={(checked) => setUseSamePassword(checked as boolean)}
              className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="same-password"
              className="text-sm font-sans font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              use the same password for all statements
            </label>
          </div>

          {useSamePassword ? (
            <div className="space-y-2">
              <Label htmlFor="common-password" className="font-sans">password for all files</Label>
              <div className="relative">
                <Input
                  id="common-password"
                  type={showCommonPassword ? "text" : "password"}
                  value={commonPassword}
                  onChange={(e) => setCommonPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowCommonPassword(!showCommonPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCommonPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs font-sans text-muted-foreground">
                Hint: Most bank statements use your DOB (DDMMYYYY) or last 4 digits of account number
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(filePasswords.entries()).map(([fileName, data]) => (
                <div key={fileName} className="space-y-2 p-4 border border-border rounded-lg">
                  <Label className="font-sans font-medium text-sm">{fileName}</Label>
                  <div className="relative">
                    <Input
                      type={data.showPassword ? "text" : "password"}
                      value={data.password}
                      onChange={(e) => handlePasswordChange(fileName, e.target.value)}
                      placeholder="Enter password"
                      className="pr-10 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(fileName)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {data.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {data.error && (
                    <p className="text-xs font-sans text-destructive">{data.error}</p>
                  )}
                </div>
              ))}
              <p className="text-xs font-sans text-muted-foreground">
                Hint: Most bank statements use your DOB (DDMMYYYY) or last 4 digits of account number
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} className="font-sans">
            cancel
          </Button>
          <Button onClick={handleSubmit} className="font-sans">
            decrypt & process
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
