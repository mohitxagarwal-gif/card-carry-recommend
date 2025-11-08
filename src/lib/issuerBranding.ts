// Issuer branding utilities for visual card differentiation

export interface IssuerBrand {
  name: string;
  color: string; // HSL value
  lightBg: string; // HSL value for light mode background
  darkBg: string; // HSL value for dark mode background
  textColor: string; // HSL value for text on brand background
}

export const issuerBrands: Record<string, IssuerBrand> = {
  'HDFC Bank': {
    name: 'HDFC Bank',
    color: '0 84% 45%', // Red
    lightBg: '0 84% 97%',
    darkBg: '0 84% 15%',
    textColor: '0 0% 100%'
  },
  'ICICI Bank': {
    name: 'ICICI Bank',
    color: '25 95% 48%', // Orange
    lightBg: '25 95% 97%',
    darkBg: '25 95% 15%',
    textColor: '0 0% 100%'
  },
  'Axis Bank': {
    name: 'Axis Bank',
    color: '0 60% 30%', // Maroon
    lightBg: '0 60% 97%',
    darkBg: '0 60% 15%',
    textColor: '0 0% 100%'
  },
  'SBI Card': {
    name: 'SBI Card',
    color: '210 100% 35%', // Blue
    lightBg: '210 100% 97%',
    darkBg: '210 100% 15%',
    textColor: '0 0% 100%'
  },
  'American Express': {
    name: 'American Express',
    color: '200 80% 40%', // Teal Blue
    lightBg: '200 80% 97%',
    darkBg: '200 80% 15%',
    textColor: '0 0% 100%'
  },
  'IndusInd Bank': {
    name: 'IndusInd Bank',
    color: '350 70% 45%', // Pink-Red
    lightBg: '350 70% 97%',
    darkBg: '350 70% 15%',
    textColor: '0 0% 100%'
  },
  'Standard Chartered': {
    name: 'Standard Chartered',
    color: '145 65% 35%', // Green
    lightBg: '145 65% 97%',
    darkBg: '145 65% 15%',
    textColor: '0 0% 100%'
  },
  'Citibank': {
    name: 'Citibank',
    color: '210 90% 45%', // Bright Blue
    lightBg: '210 90% 97%',
    darkBg: '210 90% 15%',
    textColor: '0 0% 100%'
  },
  'HSBC': {
    name: 'HSBC',
    color: '0 85% 40%', // HSBC Red
    lightBg: '0 85% 97%',
    darkBg: '0 85% 15%',
    textColor: '0 0% 100%'
  },
  'RBL Bank': {
    name: 'RBL Bank',
    color: '265 75% 50%', // Purple
    lightBg: '265 75% 97%',
    darkBg: '265 75% 15%',
    textColor: '0 0% 100%'
  },
  'YES Bank': {
    name: 'YES Bank',
    color: '210 100% 40%', // Blue
    lightBg: '210 100% 97%',
    darkBg: '210 100% 15%',
    textColor: '0 0% 100%'
  },
  'Kotak Mahindra Bank': {
    name: 'Kotak Mahindra Bank',
    color: '0 90% 35%', // Red
    lightBg: '0 90% 97%',
    darkBg: '0 90% 15%',
    textColor: '0 0% 100%'
  }
};

export const getIssuerBrand = (issuer: string): IssuerBrand => {
  return issuerBrands[issuer] || {
    name: issuer,
    color: '220 14% 50%', // Default neutral
    lightBg: '220 14% 97%',
    darkBg: '220 14% 20%',
    textColor: '222 47% 11%'
  };
};

export const getHeroFeature = (card: { 
  forex_markup_pct: number; 
  lounge_access: string; 
  reward_structure: string;
  annual_fee: number;
}): { label: string; icon: string } | null => {
  // Priority: Forex → Lounge → Rewards → Fee
  
  if (card.forex_markup_pct === 0) {
    return { label: 'ZERO FOREX', icon: '✈️' };
  }
  
  if (card.lounge_access.toLowerCase().includes('unlimited')) {
    return { label: 'UNLIMITED LOUNGE', icon: '🛋️' };
  }
  
  if (card.reward_structure.toLowerCase().includes('5%') || 
      card.reward_structure.toLowerCase().includes('10x')) {
    return { label: '5% CASHBACK', icon: '💰' };
  }
  
  if (card.annual_fee === 0) {
    return { label: 'ZERO FEE', icon: '🎁' };
  }
  
  return null;
};

export const getFeeStyle = (annualFee: number): {
  variant: 'default' | 'secondary' | 'outline';
  className: string;
  label: string;
} => {
  if (annualFee === 0) {
    return {
      variant: 'default',
      className: 'bg-success text-white border-success',
      label: 'FREE'
    };
  }
  
  if (annualFee <= 1000) {
    return {
      variant: 'secondary',
      className: 'bg-primary/10 text-primary border-primary/20',
      label: `₹${annualFee.toLocaleString('en-IN')}/yr`
    };
  }
  
  if (annualFee <= 5000) {
    return {
      variant: 'outline',
      className: 'bg-warning/10 text-warning border-warning/20',
      label: `₹${annualFee.toLocaleString('en-IN')}/yr`
    };
  }
  
  return {
    variant: 'outline',
    className: 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary',
    label: `₹${annualFee.toLocaleString('en-IN')}/yr PREMIUM`
  };
};
