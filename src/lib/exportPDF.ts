import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RecommendationSnapshot } from "@/types/dashboard";

interface UserProfile {
  full_name: string | null;
  email: string;
}

interface RecommendedCard {
  card_id: string;
  issuer?: string;
  name?: string;
  annual_fee?: number;
  key_perks?: string[];
  reward_type?: string[];
}

export const exportRecommendationsPDF = (
  snapshot: RecommendationSnapshot,
  recommendedCards: RecommendedCard[],
  userProfile: UserProfile
) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text("Card & Carry Recommendations", 14, 20);
  
  // User info
  doc.setFontSize(10);
  doc.text(`For: ${userProfile.full_name || userProfile.email}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 36);
  
  // Savings estimate
  doc.setFontSize(14);
  doc.text("Estimated Annual Savings", 14, 50);
  doc.setFontSize(16);
  doc.text(
    `₹${snapshot.savings_min.toLocaleString('en-IN')} - ₹${snapshot.savings_max.toLocaleString('en-IN')}`,
    14,
    58
  );
  
  // Confidence
  doc.setFontSize(10);
  doc.text(`Confidence: ${snapshot.confidence.toUpperCase()}`, 14, 66);
  
  // Recommended cards table
  const tableData = recommendedCards.map((card) => [
    card.name || card.card_id,
    card.issuer || "-",
    card.annual_fee ? `₹${card.annual_fee.toLocaleString('en-IN')}` : "-",
    card.reward_type?.join(", ") || "-",
    card.key_perks?.slice(0, 2).join(", ") || "-",
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [["Card Name", "Issuer", "Annual Fee", "Rewards", "Key Perks"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [51, 51, 51] },
    styles: { fontSize: 9 },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 75;
  doc.setFontSize(8);
  doc.text(
    "This is a personalized recommendation based on your spending patterns.",
    14,
    finalY + 10
  );
  doc.text(
    "Please verify terms and conditions with card issuers before applying.",
    14,
    finalY + 15
  );
  
  // Save
  const filename = `card-carry-recommendations-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
