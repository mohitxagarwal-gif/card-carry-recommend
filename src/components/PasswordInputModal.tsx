import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Lock, Info } from "lucide-react";

interface PasswordInputModalProps {
  open: boolean;
  encryptedFiles: File[];
  onSubmit: (passwords: Map<string, string>) => void;
  onCancel: () => void;
}

export function PasswordInputModal({ open, encryptedFiles, onSubmit, onCancel }: PasswordInputModalProps) {
  const [passwords, setPasswords] = useState<Map<string, string>>(new Map());
  const [showPasswords, setShowPasswords] = useState<Map<string, boolean>>(new Map());
  const [useSamePassword, setUseSamePassword] = useState(encryptedFiles.length > 1);
  const [singlePassword, setSinglePassword] = useState("");

  useEffect(() => {
    // Reset state when files change
    setPasswords(new Map());
    setShowPasswords(new Map());
    setUseSamePassword(encryptedFiles.length > 1);
    setSinglePassword("");
  }, [encryptedFiles]);

  const handlePasswordChange = (fileName: string, value: string) => {
    const newPasswords = new Map(passwords);
    newPasswords.set(fileName, value);
    setPasswords(newPasswords);
  };

  const togglePasswordVisibility = (fileName: string) => {
    const newShowPasswords = new Map(showPasswords);
    newShowPasswords.set(fileName, !newShowPasswords.get(fileName));
    setShowPasswords(newShowPasswords);
  };

  const handleSubmit = () => {
    const finalPasswords = new Map<string, string>();
    
    if (useSamePassword && encryptedFiles.length > 1) {
      // Use single password for all files
      encryptedFiles.forEach(file => {
        finalPasswords.set(file.name, singlePassword);
      });
    } else {
      // Use individual passwords
      encryptedFiles.forEach(file => {
        const password = passwords.get(file.name) || "";
        finalPasswords.set(file.name, password);
      });
    }
    
    onSubmit(finalPasswords);
  };

  const isValid = useSamePassword 
    ? singlePassword.length > 0 
    : encryptedFiles.every(file => passwords.get(file.name)?.length || 0 > 0);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5 text-primary" />
            Password Required
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {encryptedFiles.length === 1 
              ? "This statement is password protected. Please enter the password to continue."
              : `${encryptedFiles.length} statements are password protected. Please enter passwords to continue.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Password hint */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs font-sans text-foreground">
                <strong>Common passwords:</strong> Your date of birth (DDMMYYYY), 
                last 4 digits of account number, or the password you use for online banking.
              </p>
            </div>
          </div>

          {/* Use same password checkbox - only show if multiple files */}
          {encryptedFiles.length > 1 && (
            <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg border border-border">
              <Checkbox
                id="use-same-password"
                checked={useSamePassword}
                onCheckedChange={(checked) => setUseSamePassword(checked === true)}
                className="border-2 border-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="use-same-password"
                className="text-sm font-sans text-foreground cursor-pointer flex-1"
              >
                Use the same password for all statements
              </Label>
            </div>
          )}

          {/* Password inputs */}
          <div className="space-y-4">
            {useSamePassword && encryptedFiles.length > 1 ? (
              // Single password field for all files
              <div className="space-y-2">
                <Label htmlFor="single-password" className="text-sm font-sans font-medium text-foreground">
                  Password for all {encryptedFiles.length} statements
                </Label>
                <div className="relative">
                  <Input
                    id="single-password"
                    type={showPasswords.get('single') ? "text" : "password"}
                    value={singlePassword}
                    onChange={(e) => setSinglePassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('single')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.get('single') ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Individual password fields
              encryptedFiles.map((file, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`password-${index}`} className="text-sm font-sans font-medium text-foreground">
                    Password for: <span className="font-normal text-muted-foreground">{file.name}</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id={`password-${index}`}
                      type={showPasswords.get(file.name) ? "text" : "password"}
                      value={passwords.get(file.name) || ""}
                      onChange={(e) => handlePasswordChange(file.name, e.target.value)}
                      placeholder="Enter password"
                      className="pr-10 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(file.name)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.get(file.name) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-foreground/20 hover:bg-foreground/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1"
            >
              Decrypt & Process
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
