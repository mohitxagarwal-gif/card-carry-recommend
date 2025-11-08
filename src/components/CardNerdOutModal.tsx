import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "@/hooks/useCards";
import { Calculator, Lightbulb, Shield, AlertTriangle, FileText, TrendingUp } from "lucide-react";

interface CardNerdOutModalProps {
  card: CreditCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CardNerdOutModal = ({ card, open, onOpenChange }: CardNerdOutModalProps) => {
  const detailedRewards = card.detailed_reward_breakdown as any || {};
  const detailedBenefits = card.detailed_benefits as any || {};
  const earningExamples = card.earning_examples as any || {};

  const hasDetailedContent = 
    card.detailed_reward_breakdown ||
    card.detailed_benefits ||
    card.earning_examples ||
    card.insider_tips ||
    card.hidden_fees ||
    card.fine_print;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold flex items-center gap-2">
            🤓 nerd out: {card.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            comprehensive deep-dive for informed decision-making
          </p>
        </DialogHeader>

        {!hasDetailedContent ? (
          <Card className="mt-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                detailed breakdown coming soon for this card.
              </p>
              <p className="text-sm text-muted-foreground">
                need this info now? contact us and we'll prioritize it.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="rewards" className="mt-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="rewards" className="text-xs">
                <TrendingUp className="h-4 w-4 mr-1" />
                earning
              </TabsTrigger>
              <TabsTrigger value="examples" className="text-xs">
                <Calculator className="h-4 w-4 mr-1" />
                examples
              </TabsTrigger>
              <TabsTrigger value="benefits" className="text-xs">
                <Shield className="h-4 w-4 mr-1" />
                benefits
              </TabsTrigger>
              <TabsTrigger value="costs" className="text-xs">
                <AlertTriangle className="h-4 w-4 mr-1" />
                costs
              </TabsTrigger>
              <TabsTrigger value="tips" className="text-xs">
                <Lightbulb className="h-4 w-4 mr-1" />
                tips
              </TabsTrigger>
              <TabsTrigger value="fine-print" className="text-xs">
                <FileText className="h-4 w-4 mr-1" />
                fine print
              </TabsTrigger>
            </TabsList>

            {/* Earning Deep Dive Tab */}
            <TabsContent value="rewards" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">reward structure breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailedRewards.base_rate && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">base earning rate</h4>
                      <p className="text-sm text-muted-foreground">{detailedRewards.base_rate}</p>
                    </div>
                  )}

                  {detailedRewards.accelerated_categories?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">accelerated categories</h4>
                      <div className="space-y-3">
                        {detailedRewards.accelerated_categories.map((cat: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{cat.category}</span>
                              <Badge variant="secondary">{cat.rate}</Badge>
                            </div>
                            {cat.cap && (
                              <p className="text-xs text-muted-foreground">cap: {cat.cap}</p>
                            )}
                            {cat.exclusions && (
                              <p className="text-xs text-muted-foreground mt-1">
                                exclusions: {cat.exclusions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.reward_caps_details && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">caps & limits</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {card.reward_caps_details}
                      </p>
                    </div>
                  )}

                  {detailedRewards.milestone_bonuses?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">milestone bonuses</h4>
                      <div className="space-y-2">
                        {detailedRewards.milestone_bonuses.map((milestone: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span className="text-sm">{milestone.threshold}</span>
                            <Badge variant="outline">{milestone.bonus}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!detailedRewards.base_rate && (
                    <p className="text-sm text-muted-foreground">
                      basic: {card.reward_structure}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Real Examples Tab */}
            <TabsContent value="examples" className="space-y-4 mt-4">
              {Object.keys(earningExamples).length > 0 ? (
                Object.entries(earningExamples).map(([key, scenario]: [string, any]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">monthly spending breakdown</h4>
                        <div className="space-y-1">
                          {Object.entries(scenario.breakdown || {}).map(([cat, amount]: [string, any]) => (
                            <div key={cat} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{cat}</span>
                              <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">estimated earnings</span>
                          <span className="text-lg font-bold text-primary">{scenario.earnings}</span>
                        </div>
                        {scenario.net_benefit && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">net benefit (after fee)</span>
                            <span className="font-semibold text-success">{scenario.net_benefit}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    earning examples will be added soon
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Complete Benefits Tab */}
            <TabsContent value="benefits" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">complete benefits breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailedBenefits.lounge_access && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">lounge access details</h4>
                      <div className="space-y-1 text-sm">
                        <p>domestic: {detailedBenefits.lounge_access.domestic_per_quarter || 'N/A'} visits/quarter</p>
                        <p>international: {detailedBenefits.lounge_access.international_per_quarter || 'N/A'} visits/quarter</p>
                        {detailedBenefits.lounge_access.guest_policy && (
                          <p className="text-muted-foreground">guest: {detailedBenefits.lounge_access.guest_policy}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {detailedBenefits.insurance_coverage?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">insurance coverage</h4>
                      <div className="space-y-2">
                        {detailedBenefits.insurance_coverage.map((insurance: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium">{insurance.type}</span>
                              <Badge variant="outline">{insurance.coverage}</Badge>
                            </div>
                            {insurance.conditions && (
                              <p className="text-xs text-muted-foreground mt-1">{insurance.conditions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.best_use_cases && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">best use cases</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {card.best_use_cases}
                      </p>
                    </div>
                  )}

                  {!detailedBenefits.lounge_access && !detailedBenefits.insurance_coverage && (
                    <p className="text-sm text-muted-foreground">
                      key benefits: {card.key_perks.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hidden Costs Tab */}
            <TabsContent value="costs" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">all fees & charges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium text-sm">annual fee</span>
                    <span className="font-bold">
                      {card.annual_fee === 0 ? 'FREE' : `₹${card.annual_fee.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {card.waiver_rule && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded">
                      <p className="text-sm font-medium text-success mb-1">fee waiver available</p>
                      <p className="text-xs text-muted-foreground">{card.waiver_rule}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium text-sm">forex markup</span>
                    <span className="font-bold">{card.forex_markup}</span>
                  </div>

                  {card.hidden_fees && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">other charges</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {card.hidden_fees}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insider Tips Tab */}
            <TabsContent value="tips" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">insider tips & optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.insider_tips ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {card.insider_tips}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded">
                        <p className="text-sm font-medium mb-1">💡 maximize rewards</p>
                        <p className="text-xs text-muted-foreground">
                          use this card for categories with highest reward rates
                        </p>
                      </div>
                      <div className="p-3 bg-warning/5 border border-warning/20 rounded">
                        <p className="text-sm font-medium mb-1">⚠️ avoid</p>
                        <p className="text-xs text-muted-foreground">
                          {card.downsides.join(', ')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        detailed tips coming soon
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fine Print Tab */}
            <TabsContent value="fine-print" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">the fine print</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.fine_print ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {card.fine_print}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">eligibility</h4>
                        <p className="text-sm text-muted-foreground">
                          {card.eligibility || 'contact issuer for details'}
                        </p>
                      </div>
                      
                      {card.docs_required && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">documents required</h4>
                          <p className="text-sm text-muted-foreground">{card.docs_required}</p>
                        </div>
                      )}

                      {card.tnc_url && (
                        <div>
                          <a 
                            href={card.tnc_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            view official terms & conditions →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
