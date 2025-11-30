import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FeeWaiverGoalsModule = () => {
  const { goals, isLoading, createGoal, calculateProgress } = useGoals();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    card_id: "",
    target_amount: "",
  });

  const handleCreateGoal = () => {
    createGoal({
      card_id: goalForm.card_id,
      target_amount: parseInt(goalForm.target_amount),
    });
    setIsAddModalOpen(false);
    setGoalForm({ card_id: "", target_amount: "" });
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-muted";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-playfair">Fee Waiver Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading goals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-playfair">Fee Waiver Goals</CardTitle>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Spending Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal_card_id">Card ID *</Label>
                <Input
                  id="goal_card_id"
                  value={goalForm.card_id}
                  onChange={(e) => setGoalForm({ ...goalForm, card_id: e.target.value })}
                  placeholder="e.g., hdfc-diners-privilege"
                />
              </div>
              <div>
                <Label htmlFor="target_amount">Target Amount (₹) *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  placeholder="e.g., 200000"
                />
              </div>
              <Button 
                onClick={handleCreateGoal} 
                disabled={!goalForm.card_id || !goalForm.target_amount}
                className="w-full"
              >
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Set spending goals to waive annual fees</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate flex-1 min-w-0">{goal.card_id}</div>
                    <div className="text-sm font-medium flex-shrink-0">{progress}%</div>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="break-all">₹{goal.current_amount?.toLocaleString('en-IN') || 0}</span>
                    <span className="break-all">₹{goal.target_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
