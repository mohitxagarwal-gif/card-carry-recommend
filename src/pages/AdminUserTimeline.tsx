import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, User } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserTimeline } from "@/hooks/useUserTimeline";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";
import { Navigate } from "react-router-dom";
import TimelineEventCard from "@/components/admin/TimelineEventCard";
import TimelineFilters from "@/components/admin/TimelineFilters";
import UserSummaryCard from "@/components/admin/UserSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUserTimeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userEmail, setUserEmail] = useState(searchParams.get("email") || "");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("userId") || null);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    searchTerm: searchParams.get("search") || "",
  });

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: timeline, isLoading: timelineLoading } = useUserTimeline(selectedUserId, filters);

  // Log admin view when timeline is accessed
  useEffect(() => {
    if (selectedUserId && userRole === 'admin') {
      logAuditEvent('ADMIN_VIEW_USER_TIMELINE', {
        category: 'admin',
        metadata: { viewed_user_id: selectedUserId }
      });
    }
  }, [selectedUserId, userRole]);

  // Redirect non-admins
  if (!roleLoading && userRole !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleUserSearch = async () => {
    if (!userEmail) return;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (data) {
      setSelectedUserId(data.id);
      setSearchParams({ email: userEmail, userId: data.id });
    } else {
      alert("User not found");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params: Record<string, string> = {};
    if (userEmail) params.email = userEmail;
    if (selectedUserId) params.userId = selectedUserId;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.dateFrom) params.dateFrom = newFilters.dateFrom;
    if (newFilters.dateTo) params.dateTo = newFilters.dateTo;
    if (newFilters.searchTerm) params.search = newFilters.searchTerm;
    
    setSearchParams(params);
  };

  if (roleLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Timeline</h1>
        <p className="text-muted-foreground">View chronological history of user actions and events</p>
      </div>

      {/* User Search */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={handleUserSearch}>
            <User className="mr-2 h-4 w-4" />
            Load User
          </Button>
        </div>
      </Card>

      {selectedUserId && (
        <>
          {/* User Summary */}
          <UserSummaryCard userId={selectedUserId} />

          {/* Filters */}
          <TimelineFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* Timeline */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Event Timeline
              {timeline && <span className="text-muted-foreground ml-2">({timeline.length} events)</span>}
            </h2>

            {timelineLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : timeline && timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map(event => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events found for this user</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
