import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications } from "@/hooks/useApplications";
import { CardApplication } from "@/types/dashboard";

interface CardStatusDropdownProps {
  cardId: string;
}

export const CardStatusDropdown = ({ cardId }: CardStatusDropdownProps) => {
  const { getApplicationStatus, updateStatus } = useApplications();
  const currentStatus = getApplicationStatus(cardId) || 'considering';

  const handleStatusChange = (status: CardApplication['status']) => {
    updateStatus({ cardId, status });
  };

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="considering">Considering</SelectItem>
        <SelectItem value="applied">Applied</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  );
};
