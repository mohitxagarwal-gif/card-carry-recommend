import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerified: () => void;
  verified: boolean;
}

export const PhoneInput = ({ value, onChange, onVerified, verified }: PhoneInputProps) => {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
    if (otpSent) {
      setOtpSent(false);
      setOtp("");
    }
  };

  const isValidPhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const handleSendOtp = async () => {
    if (!isValidPhone(value)) {
      toast.error("Enter a 10-digit number starting with 6-9");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-phone-otp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_e164: `+91${value}` }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP");
      }

      setOtpSent(true);
      toast.success("OTP sent successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phone-otp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone_e164: `+91${value}`,
          otp_code: otpValue 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid OTP");
      }

      toast.success("Phone verified successfully!");
      onVerified();
    } catch (error: any) {
      toast.error(error.message);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium text-muted-foreground px-3 py-2 border rounded-md bg-muted">+91</span>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            value={value}
            onChange={handlePhoneChange}
            disabled={verified || otpSent}
            className="flex-1"
          />
        </div>
        {!otpSent && !verified && (
          <Button
            type="button"
            onClick={handleSendOtp}
            disabled={!isValidPhone(value) || loading}
            className="whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
          </Button>
        )}
        {verified && (
          <div className="flex items-center text-green-600">
            <Check className="w-5 h-5" />
          </div>
        )}
      </div>

      {otpSent && !verified && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to your phone</p>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (value.length === 6) {
                handleVerifyOtp(value);
              }
            }}
            disabled={loading}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        For account security and updates. No promotional SMS unless you opt in.
      </p>
    </div>
  );
};
