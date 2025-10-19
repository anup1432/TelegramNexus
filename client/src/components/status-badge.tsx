import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  ArrowRightLeft, 
  FileSearch, 
  DollarSign, 
  XCircle 
} from "lucide-react";

type Status = "submitted" | "verified" | "ownership" | "review" | "paid" | "rejected" | "pending" | "approved";

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
}

const statusConfig: Record<string, { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  className: string;
}> = {
  submitted: {
    label: "Submitted",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
    className: "bg-muted text-muted-foreground",
  },
  verified: {
    label: "Verified",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  ownership: {
    label: "Ownership Transfer",
    variant: "outline",
    icon: <ArrowRightLeft className="w-3 h-3" />,
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  review: {
    label: "Under Review",
    variant: "outline",
    icon: <FileSearch className="w-3 h-3" />,
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  paid: {
    label: "Paid",
    variant: "outline",
    icon: <DollarSign className="w-3 h-3" />,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  approved: {
    label: "Approved",
    variant: "outline",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  // Fallback for unknown status
  if (!config) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-muted text-muted-foreground ${className || ""} flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide`}
        data-testid={`badge-status-${status}`}
      >
        <Clock className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className || ""} flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide`}
      data-testid={`badge-status-${status}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
