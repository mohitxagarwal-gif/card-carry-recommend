import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface TimelineFiltersProps {
  filters: {
    category: string;
    dateFrom: string;
    dateTo: string;
    searchTerm: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function TimelineFilters({ filters, onFilterChange }: TimelineFiltersProps) {
  const categories = [
    { value: "", label: "All Categories" },
    { value: "auth", label: "Authentication" },
    { value: "onboarding", label: "Onboarding" },
    { value: "statement", label: "Statements" },
    { value: "recommendation", label: "Recommendations" },
    { value: "card_action", label: "Card Actions" },
    { value: "data_rights", label: "Data Rights" },
    { value: "admin", label: "Admin Actions" },
    { value: "error", label: "Errors" },
    { value: "system", label: "System" }
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Category</label>
          <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">From Date</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
        </div>

        {/* Date To */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">To Date</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>

        {/* Search */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
