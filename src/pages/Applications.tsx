import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useApplications } from "@/hooks/useApplications";
import { useCards } from "@/hooks/useCards";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { CardStatusDropdown } from "@/components/CardStatusDropdown";

const Applications = () => {
  const { applications, isLoading } = useApplications();
  const { data: cards } = useCards();

  useEffect(() => {
    trackEvent("apps_view");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const getCardDetails = (cardId: string) => {
    return cards?.find(c => c.card_id === cardId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-8">
          application tracker
        </h1>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Applications Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Track your card applications here. We don't pull your credit - you update the status manually.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {['considering', 'applied', 'approved', 'rejected'].map((status) => {
              const statusApps = applications.filter(app => app.status === status);
              
              if (statusApps.length === 0) return null;

              return (
                <div key={status}>
                  <h2 className="text-xl font-semibold capitalize mb-4 flex items-center gap-2">
                    {status}
                    <Badge variant="outline">{statusApps.length}</Badge>
                  </h2>

                  <div className="grid gap-4">
                    {statusApps.map((app) => {
                      const card = getCardDetails(app.card_id);
                      
                      return (
                        <Card key={app.id}>
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <CardTitle>{card?.name || app.card_id}</CardTitle>
                                <p className="text-sm text-muted-foreground">{card?.issuer}</p>
                              </div>
                              <CardStatusDropdown cardId={app.card_id} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {app.applied_date && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Applied: {new Date(app.applied_date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                            
                            {app.notes && (
                              <div>
                                <p className="text-sm font-medium">Notes:</p>
                                <p className="text-sm text-muted-foreground">{app.notes}</p>
                              </div>
                            )}

                            {app.issuer_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(app.issuer_link!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Application
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Applications;
