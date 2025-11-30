import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const CreditCardChipIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Card outline */}
    <rect x="2" y="5" width="20" height="14" rx="2" />
    {/* Magnetic stripe */}
    <path d="M2 10h20" />
    {/* Chip */}
    <rect x="6" y="13" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 13v3M9 13v3" strokeWidth="1" />
  </svg>
);

export const CardPaymentIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Terminal base */}
    <rect x="2" y="6" width="10" height="12" rx="1" fill="currentColor" fillOpacity="0.05" />
    <path d="M2 9h10" />
    {/* Screen */}
    <rect x="4" y="10.5" width="6" height="4" rx="0.5" />
    {/* Card swiping with motion */}
    <path d="M14 4l6 6" />
    <path d="M14 8l6 6" strokeWidth="2" />
    <path d="M14 12l6 6" />
    {/* Motion lines */}
    <path d="M21 8l1.5 1.5M21 12l1.5 1.5" strokeWidth="1" opacity="0.5" />
  </svg>
);

export const CardToGiftIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Card portion (fading) */}
    <rect x="2" y="4" width="10" height="6" rx="1" opacity="0.4" />
    <path d="M2 7h10" opacity="0.4" />
    {/* Transform arrow */}
    <path d="M12 7h2" strokeDasharray="2 2" />
    {/* Gift box */}
    <rect x="14" y="10" width="8" height="8" rx="0.5" fill="currentColor" fillOpacity="0.05" />
    <path d="M14 13h8" />
    <path d="M18 10v8" />
    {/* Bow on top */}
    <path d="M16 10c0-1 0.5-2 2-2M20 10c0-1-0.5-2-2-2" />
    {/* Sparkles */}
    <path d="M12 4l0.5 1.5L14 6l-1.5 0.5L12 8l-0.5-1.5L10 6l1.5-0.5z" strokeWidth="1" />
    <path d="M20 4l0.3 0.9L21.5 5.2l-0.9 0.3L20 6.5l-0.3-0.9L18.5 5.2l0.9-0.3z" strokeWidth="1" opacity="0.7" />
  </svg>
);

export const RewardUnlockedIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Circular badge */}
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.05" />
    {/* Checkmark */}
    <path d="M8 12l3 3l5-6" strokeWidth="2" />
    {/* Gift box in center (small) */}
    <rect x="10" y="14" width="4" height="3" rx="0.3" strokeWidth="1" opacity="0.6" />
    <path d="M10 15.5h4" strokeWidth="0.8" opacity="0.6" />
    <path d="M12 14v3" strokeWidth="0.8" opacity="0.6" />
    {/* Sparkle effects around */}
    <path d="M5 6l0.5 1L7 7.5L6.5 8L6 9.5L5.5 8L4 7.5L4.5 7z" strokeWidth="0.8" />
    <path d="M18 5l0.5 1L20 6.5L19.5 7L19 8.5L18.5 7L17 6.5L17.5 6z" strokeWidth="0.8" />
    <path d="M17 16l0.4 0.8L18.5 17.2l-0.8 0.4L17 18.5l-0.4-0.8L15.5 17.2l0.8-0.4z" strokeWidth="0.8" opacity="0.7" />
  </svg>
);
