import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CustomGoalChatProps {
  open: boolean;
  onComplete: (data: {
    monthlySpend: number;
    spendSplit: Record<string, number>;
    customWeights: Record<string, number>;
    goalDescription: string;
  }) => void;
  onCancel: () => void;
}

export function CustomGoalChat({ open, onComplete, onCancel }: CustomGoalChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! What's your main priority for a credit card? (e.g., travel, cashback, shopping)",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("goal-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      // Check if conversation is complete
      if (data.goalData) {
        setConversationComplete(true);
        setTimeout(() => {
          onComplete({
            monthlySpend: data.goalData.monthlySpend,
            spendSplit: data.goalData.spendSplit,
            customWeights: data.goalData.customWeights,
            goalDescription: data.goalData.goalDescription,
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Failed to process message. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Could you rephrase?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !conversationComplete && onCancel()}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] sm:h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline">Custom Goal - AI Assistant</span>
            <span className="sm:hidden">AI Assistant</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share your priorities to get personalized recommendations
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            {conversationComplete && (
              <div className="flex justify-center">
                <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 text-sm font-medium">
                  ✓ Got it! Generating your personalized recommendations...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading || conversationComplete}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading || conversationComplete}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
