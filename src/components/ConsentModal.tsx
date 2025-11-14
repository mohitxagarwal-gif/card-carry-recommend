import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";
import type { ExtendedProfileUpdate } from "@/types/supabase-extended";

interface ConsentModalProps {
  open: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

const CURRENT_TERMS_VERSION = "1.0";
const CURRENT_PRIVACY_VERSION = "1.0";

export const ConsentModal = ({ open, onConsent, onDecline }: ConsentModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!agreed) {
      toast.error("Please review and accept the terms to continue");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: ExtendedProfileUpdate = {
        data_processing_consent: true,
        data_processing_consent_at: new Date().toISOString(),
        terms_version: CURRENT_TERMS_VERSION,
        privacy_version: CURRENT_PRIVACY_VERSION,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("id", user.id);

      if (error) throw error;

      // Log consent in audit trail
      await logAuditEvent("CONSENT_GRANTED", {
        category: "auth",
        metadata: {
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
        },
      });

      toast.success("Thank you for your consent");
      onConsent();
    } catch (error) {
      console.error("Error saving consent:", error);
      toast.error("Failed to save consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    await logAuditEvent("CONSENT_DECLINED", {
      category: "auth",
      severity: "warning",
    });
    onDecline();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDecline()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Data Processing Consent</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p>
              To provide personalized credit card recommendations, we need your consent to process your financial transaction data.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">What we collect:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Transaction dates, amounts, and merchant names</li>
                <li>Spending patterns and categories</li>
                <li>Basic profile information (age range, income band, location)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">What we DON'T collect:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Full credit card numbers, CVV, or PINs</li>
                <li>Banking passwords or login credentials</li>
                <li>Account numbers or routing information</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">How we use your data:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Analyze your spending to recommend suitable credit cards</li>
                <li>Calculate potential rewards and savings</li>
                <li>Improve our recommendation algorithm</li>
              </ul>
            </div>

            <p className="text-sm">
              We store your data securely and never sell it to third parties. You can request to export or delete your data at any time from your profile settings.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label
            htmlFor="consent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to the data processing terms
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            onClick={handleConsent}
            disabled={!agreed || loading}
          >
            {loading ? "Processing..." : "Accept & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
