export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: "Visa" | "Mastercard" | "Rupay" | "American Express";
  annualFee: number;
  waiverRule?: string;
  welcomeBonus: string;
  rewardStructure: string;
  keyPerks: string[];
  loungeAccess: string;
  forexMarkup: string;
  idealFor: string;
  downsides: string;
  categoryBadges: string[];
  imageUrl?: string;
}

export const creditCards: CreditCard[] = [
  {
    id: "hdfc-regalia",
    name: "HDFC Bank Regalia",
    issuer: "HDFC Bank",
    network: "Visa",
    annualFee: 2500,
    waiverRule: "₹3L annual spend",
    welcomeBonus: "5,000 reward points",
    rewardStructure: "4 points per ₹150 spent",
    keyPerks: ["8 lounge visits/year", "10x rewards on dining", "Zero forex markup"],
    loungeAccess: "8 domestic visits/year",
    forexMarkup: "2% + GST",
    idealFor: "Travel and dining enthusiasts",
    downsides: "Moderate annual fee, limited international lounge access",
    categoryBadges: ["Travel", "Dining"],
  },
  {
    id: "axis-magnus",
    name: "Axis Bank Magnus",
    issuer: "Axis Bank",
    network: "Visa",
    annualFee: 10000,
    waiverRule: "₹15L annual spend",
    welcomeBonus: "25,000 Edge Miles",
    rewardStructure: "12 Edge Miles per ₹200",
    keyPerks: ["Unlimited lounge access", "Hotel partnerships", "12x miles on travel"],
    loungeAccess: "Unlimited domestic + international",
    forexMarkup: "3.5% + GST",
    idealFor: "Luxury travelers with high spending",
    downsides: "High annual fee, devaluation risk",
    categoryBadges: ["Luxury", "Travel"],
  },
  {
    id: "sbi-simplysave",
    name: "SBI SimplySAVE",
    issuer: "SBI Card",
    network: "Visa",
    annualFee: 499,
    waiverRule: "Free for first year",
    welcomeBonus: "2,000 bonus points",
    rewardStructure: "5% cashback on dining, groceries, movies",
    keyPerks: ["5% cashback on select categories", "Low annual fee", "Wide acceptance"],
    loungeAccess: "None",
    forexMarkup: "3.5% + GST",
    idealFor: "Daily spending and groceries",
    downsides: "No lounge access, limited premium perks",
    categoryBadges: ["Daily", "Cashback"],
  },
  {
    id: "icici-amazon-pay",
    name: "ICICI Amazon Pay",
    issuer: "ICICI Bank",
    network: "Visa",
    annualFee: 0,
    welcomeBonus: "₹500 Amazon gift voucher",
    rewardStructure: "5% on Amazon, 1% elsewhere",
    keyPerks: ["5% back on Amazon", "No annual fee", "Instant approval"],
    loungeAccess: "None",
    forexMarkup: "3.5% + GST",
    idealFor: "Online shopping enthusiasts",
    downsides: "Limited rewards outside Amazon",
    categoryBadges: ["Online", "Cashback"],
  },
  {
    id: "amex-platinum-travel",
    name: "American Express Platinum Travel",
    issuer: "American Express",
    network: "American Express",
    annualFee: 5000,
    waiverRule: "₹4L annual spend",
    welcomeBonus: "20,000 bonus points",
    rewardStructure: "10 points per ₹50 on travel",
    keyPerks: ["Taj vouchers", "Hotel memberships", "Priority Pass"],
    loungeAccess: "Priority Pass membership",
    forexMarkup: "3.5% + GST",
    idealFor: "Frequent travelers with hotel preferences",
    downsides: "Limited acceptance in India, high fee",
    categoryBadges: ["Travel", "Premium"],
  },
  {
    id: "yes-marquee",
    name: "Yes Bank Marquee",
    issuer: "Yes Bank",
    network: "Mastercard",
    annualFee: 10000,
    waiverRule: "₹8L annual spend",
    welcomeBonus: "50,000 bonus points",
    rewardStructure: "8 points per ₹200",
    keyPerks: ["Unlimited golf", "Concierge service", "Annual vouchers worth ₹20k"],
    loungeAccess: "Unlimited Priority Pass",
    forexMarkup: "3.5% + GST",
    idealFor: "Premium lifestyle and golf enthusiasts",
    downsides: "High fee, bank stability concerns",
    categoryBadges: ["Luxury", "Lifestyle"],
  },
  {
    id: "hsbc-live-plus",
    name: "HSBC Live+",
    issuer: "HSBC Bank",
    network: "Mastercard",
    annualFee: 999,
    waiverRule: "₹1L annual spend",
    welcomeBonus: "1,500 reward points",
    rewardStructure: "10x on entertainment, 2x elsewhere",
    keyPerks: ["10x rewards on OTT/movies", "Fuel surcharge waiver", "Dining offers"],
    loungeAccess: "2 visits/quarter",
    forexMarkup: "3.5% + GST",
    idealFor: "Entertainment and OTT lovers",
    downsides: "Limited lounge access, moderate rewards",
    categoryBadges: ["Entertainment", "Lifestyle"],
  },
  {
    id: "idfc-first-wealth",
    name: "IDFC FIRST Wealth",
    issuer: "IDFC FIRST Bank",
    network: "Visa",
    annualFee: 10000,
    waiverRule: "Free with salary account",
    welcomeBonus: "10,000 reward points",
    rewardStructure: "3x on all spends, 10x on travel",
    keyPerks: ["Airport meet & assist", "Golf privileges", "Exclusive dining"],
    loungeAccess: "Unlimited domestic + international",
    forexMarkup: "1.75% + GST (best in class)",
    idealFor: "International travelers and NRIs",
    downsides: "Requires wealth account, limited awareness",
    categoryBadges: ["Travel", "Premium"],
  },
  {
    id: "kotak-league-platinum",
    name: "Kotak League Platinum",
    issuer: "Kotak Mahindra Bank",
    network: "Visa",
    annualFee: 999,
    waiverRule: "₹90k annual spend",
    welcomeBonus: "500 bonus points",
    rewardStructure: "4 points per ₹150",
    keyPerks: ["Fuel surcharge waiver", "Utility bill discounts", "Zero forex on intl spends"],
    loungeAccess: "4 domestic visits/year",
    forexMarkup: "0% on intl transactions",
    idealFor: "International spenders on a budget",
    downsides: "Limited premium perks",
    categoryBadges: ["Travel", "Value"],
  },
  {
    id: "standard-chartered-ultimate",
    name: "Standard Chartered Ultimate",
    issuer: "Standard Chartered",
    network: "Visa",
    annualFee: 4999,
    waiverRule: "₹6L annual spend",
    welcomeBonus: "10,000 bonus points",
    rewardStructure: "5% cashback on top 2 categories",
    keyPerks: ["Smart-category cashback", "Airport transfers", "Premium dining"],
    loungeAccess: "6 Priority Pass visits/year",
    forexMarkup: "3.5% + GST",
    idealFor: "Category-focused high spenders",
    downsides: "Complex reward structure",
    categoryBadges: ["Cashback", "Premium"],
  },
  {
    id: "indusind-pinnacle",
    name: "IndusInd Bank Pinnacle",
    issuer: "IndusInd Bank",
    network: "Visa",
    annualFee: 10000,
    waiverRule: "₹8L annual spend",
    welcomeBonus: "20,000 reward points",
    rewardStructure: "3 points per ₹100",
    keyPerks: ["Movie tickets 4/month", "Buy 1 Get 1 dining", "Zero forex on spends abroad"],
    loungeAccess: "Unlimited Priority Pass",
    forexMarkup: "0% on select MCCs",
    idealFor: "Entertainment and international spenders",
    downsides: "High fee, complex terms",
    categoryBadges: ["Entertainment", "Travel"],
  },
  {
    id: "rbl-world-safari",
    name: "RBL Bank World Safari",
    issuer: "RBL Bank",
    network: "Mastercard",
    annualFee: 1000,
    waiverRule: "₹1.5L annual spend",
    welcomeBonus: "5,000 bonus points",
    rewardStructure: "4 points per ₹100",
    keyPerks: ["Fuel surcharge waiver", "Dining privileges", "Airport lounge"],
    loungeAccess: "4 domestic visits/year",
    forexMarkup: "3.5% + GST",
    idealFor: "Mid-tier spenders seeking lounge access",
    downsides: "Limited premium features",
    categoryBadges: ["Lifestyle", "Value"],
  },
];

export const issuers = ["All", "HDFC Bank", "Axis Bank", "SBI Card", "ICICI Bank", "American Express", "Yes Bank", "HSBC Bank", "IDFC FIRST Bank", "Kotak Mahindra Bank", "Standard Chartered", "IndusInd Bank", "RBL Bank"];

export const feeCategories = ["All", "No Fee", "Low (< ₹1,000)", "Medium (₹1,000 - ₹5,000)", "High (> ₹5,000)"];

export const rewardTypes = ["All", "Cashback", "Points", "Miles"];

export const perkCategories = ["All", "Lounge", "Dining", "Fuel", "Online Shopping", "Entertainment", "Travel", "Golf"];

export const networks = ["All", "Visa", "Mastercard", "Rupay", "American Express"];

export const forexCategories = ["All", "Zero Markup", "Low (< 2%)", "Standard (2-3.5%)", "High (> 3.5%)"];
