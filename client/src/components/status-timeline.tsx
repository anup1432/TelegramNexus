import { Check, X } from "lucide-react";

type Status = "submitted" | "verified" | "ownership" | "review" | "paid" | "rejected";

interface StatusTimelineProps {
  currentStatus: Status;
  rejectionReason?: string;
}

const steps = [
  { id: "submitted", label: "Submitted" },
  { id: "verified", label: "Verified" },
  { id: "ownership", label: "Ownership" },
  { id: "review", label: "Review" },
  { id: "paid", label: "Paid" },
];

export function StatusTimeline({ currentStatus, rejectionReason }: StatusTimelineProps) {
  if (currentStatus === "rejected") {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/20 p-2">
            <X className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive mb-1">Group Rejected</h3>
            {rejectionReason && (
              <p className="text-sm text-muted-foreground">{rejectionReason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full" data-testid="status-timeline">
      {/* Desktop horizontal timeline */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "w-10 h-10 bg-chart-2 text-white"
                        : isActive
                        ? "w-12 h-12 bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "w-10 h-10 bg-muted text-muted-foreground"
                    }`}
                    data-testid={`timeline-step-${step.id}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-colors ${
                      index < currentIndex ? "bg-chart-2" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "w-10 h-10 bg-chart-2 text-white"
                      : isActive
                      ? "w-12 h-12 bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "w-10 h-10 bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-1 h-12 my-1 rounded transition-colors ${
                      index < currentIndex ? "bg-chart-2" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-2">
                <span
                  className={`text-base font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
