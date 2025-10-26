import { RecommendationSnapshot } from "@/types/dashboard";
import { CardApplication } from "@/types/dashboard";
import { UserShortlist } from "@/types/dashboard";

interface UserCard {
  id: string;
  card_id: string;
  is_active: boolean | null;
}

export interface NextStep {
  id: string;
  text: string;
  cta: string;
  action: () => void;
  priority: number;
}

export function generateNextSteps(
  snapshot: RecommendationSnapshot | null,
  applications: CardApplication[],
  shortlist: UserShortlist[],
  userCards: UserCard[],
  navigate: (path: string) => void
): NextStep[] {
  const steps: NextStep[] = [];

  // Priority 100: No snapshot - Complete analysis
  if (!snapshot) {
    steps.push({
      id: "complete_analysis",
      text: "Complete your spending analysis to get personalized card recommendations",
      cta: "Upload Statements",
      action: () => navigate("/upload"),
      priority: 100,
    });
    return steps.slice(0, 3);
  }

  // Priority 90: Considering cards - Apply to top card
  const consideringApps = applications.filter((app) => app.status === "considering");
  if (consideringApps.length > 0) {
    const topCard = consideringApps[0];
    steps.push({
      id: "apply_considering",
      text: `Apply to ${topCard.card_id} to start earning rewards`,
      cta: "View Card",
      action: () => navigate("/recs"),
      priority: 90,
    });
  }

  // Priority 85: Applied but no approved - Check application status
  const appliedNotApproved = applications.filter(
    (app) => app.status === "applied"
  );
  if (appliedNotApproved.length > 0) {
    const pendingCard = appliedNotApproved[0];
    steps.push({
      id: "check_application",
      text: `Check application status for ${pendingCard.card_id}`,
      cta: "Track Applications",
      action: () => navigate("/applications"),
      priority: 85,
    });
  }

  // Priority 80: Low confidence - Upload more statements
  if (snapshot.confidence === "low") {
    steps.push({
      id: "improve_confidence",
      text: "Upload more statements for better accuracy and personalization",
      cta: "Upload More",
      action: () => navigate("/upload"),
      priority: 80,
    });
  }

  // Priority 75: Shortlist but no applications - Start applying
  if (shortlist.length > 0 && applications.length === 0) {
    steps.push({
      id: "start_applying",
      text: `You have ${shortlist.length} shortlisted cards. Start your application journey`,
      cta: "View Shortlist",
      action: () => navigate("/recs"),
      priority: 75,
    });
  }

  // Priority 70: Approved cards - Add to My Cards
  const approvedApps = applications.filter((app) => app.status === "approved");
  const approvedNotInCards = approvedApps.filter(
    (app) => !userCards.find((card) => card.card_id === app.card_id)
  );
  if (approvedNotInCards.length > 0) {
    const approvedCard = approvedNotInCards[0];
    steps.push({
      id: "add_to_my_cards",
      text: `Add ${approvedCard.card_id} to My Cards to track renewals and benefits`,
      cta: "Go to Dashboard",
      action: () => navigate("/dashboard"),
      priority: 70,
    });
  }

  // Priority 65: Fee waiver eligible - Set spending goal
  const activeCards = userCards.filter((card) => card.is_active);
  if (activeCards.length > 0) {
    steps.push({
      id: "set_fee_waiver_goal",
      text: "Set spending goals to waive annual fees on your cards",
      cta: "Set Goals",
      action: () => navigate("/dashboard"),
      priority: 65,
    });
  }

  // Priority 60: Old analysis - Re-analyze
  if (snapshot.created_at) {
    const daysOld = Math.floor(
      (Date.now() - new Date(snapshot.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld > 60) {
      steps.push({
        id: "reanalyze",
        text: "Your analysis is over 60 days old. Re-analyze with recent statements",
        cta: "Re-analyze",
        action: () => navigate("/upload"),
        priority: 60,
      });
    }
  }

  // Priority 50: No reminders - Set bill due date reminders
  steps.push({
    id: "set_reminders",
    text: "Set bill due date reminders to never miss a payment",
    cta: "Add Reminder",
    action: () => navigate("/dashboard"),
    priority: 50,
  });

  // Sort by priority descending and return top 3
  steps.sort((a, b) => b.priority - a.priority);
  return steps.slice(0, 3);
}
