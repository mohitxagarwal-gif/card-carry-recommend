import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreditCard } from '@/hooks/useCards';

interface CompareContextType {
  selectedCards: CreditCard[];
  addCard: (card: CreditCard) => void;
  removeCard: (cardId: string) => void;
  clearAll: () => void;
  isSelected: (cardId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCards, setSelectedCards] = useState<CreditCard[]>([]);

  const addCard = (card: CreditCard) => {
    if (selectedCards.length >= 3) {
      return; // Max 3 cards for comparison
    }
    if (!selectedCards.find(c => c.id === card.id)) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const removeCard = (cardId: string) => {
    setSelectedCards(selectedCards.filter(c => c.id !== cardId));
  };

  const clearAll = () => {
    setSelectedCards([]);
  };

  const isSelected = (cardId: string) => {
    return selectedCards.some(c => c.id === cardId);
  };

  return (
    <CompareContext.Provider value={{ selectedCards, addCard, removeCard, clearAll, isSelected }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return context;
};
