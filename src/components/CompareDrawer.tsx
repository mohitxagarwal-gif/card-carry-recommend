import { useNavigate } from "react-router-dom";
import { useCompare } from "@/contexts/CompareContext";
import { CreditCard } from "@/hooks/useCards";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { X } from "lucide-react";
import { Badge } from "./ui/badge";

export const CompareDrawer = () => {
  const navigate = useNavigate();
  const { selectedCards, removeCard, clearAll } = useCompare();

  if (selectedCards.length === 0) return null;

  return (
    <>
      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-surface glass-highlight border-t border-white/20 px-6 py-4 animate-slide-up-fade">
        <div className="container mx-auto flex items-center justify-between">
          <span className="text-sm md:text-base font-sans text-foreground">
            {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
          </span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm" className="font-sans gloss-band">
                compare {selectedCards.length} {selectedCards.length === 1 ? 'card' : 'cards'} →
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-2xl font-heading font-bold">compare cards</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-sans text-muted-foreground">
                    comparing {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearAll}
                      className="font-sans"
                    >
                      clear all
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => navigate("/auth")}
                      className="font-sans"
                    >
                      which one fits me? →
                    </Button>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="rounded-lg border border-border/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-sans font-medium">feature</TableHead>
                        {selectedCards.map(card => (
                          <TableHead key={card.id} className="font-sans font-medium">
                            <div className="flex items-start justify-between gap-2">
                              <span>{card.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCard(card.id)}
                                className="h-6 w-6 p-0 hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-sans font-medium">annual fee</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans">
                            {card.annual_fee === 0 ? "Free" : `₹${card.annual_fee.toLocaleString('en-IN')}`}
                            {card.waiver_rule && (
                              <p className="text-xs text-muted-foreground mt-1">{card.waiver_rule}</p>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">welcome bonus</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans">{card.welcome_bonus}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">rewards</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans text-sm">{card.reward_structure}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">lounge</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans text-sm">{card.lounge_access}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">forex markup</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans text-sm">{card.forex_markup}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">ideal for</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans text-sm">{card.ideal_for.join(", ")}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">downsides</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id} className="font-sans text-sm text-muted-foreground">{card.downsides.join(", ")}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-sans font-medium">categories</TableCell>
                        {selectedCards.map(card => (
                          <TableCell key={card.id}>
                            <div className="flex flex-wrap gap-1">
                              {card.category_badges.map(badge => (
                                <Badge key={badge} variant="secondary" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};
