import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { Users, Calendar, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";

interface GroupCardProps {
  group: Group;
  onViewDetails?: (group: Group) => void;
}

export function GroupCard({ group, onViewDetails }: GroupCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createdDate = new Date(group.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const autoJoinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/telegram/join", {
        groupLink: group.link,
        groupId: group.id,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/stats"] });
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
      } else {
        toast({
          title: "Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-group-${group.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate mb-1">
              {group.type === "single" ? "Single Group" : "Folder of Groups"}
            </h3>
            <a
              href={group.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              data-testid={`link-group-${group.id}`}
            >
              <span className="truncate">{group.link}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          <StatusBadge status={group.status as any} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {group.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {group.members && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{group.members.toLocaleString()} members</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{createdDate}</span>
          </div>
        </div>

        {group.groupAge && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium">
            Age: {group.groupAge}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div className="flex-1">
          {group.price ? (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Estimated Value</p>
              <p className="text-xl font-bold text-primary" data-testid={`text-price-${group.id}`}>
                ${parseFloat(group.price).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Price pending</p>
          )}
        </div>

        <div className="flex gap-2">
          {group.status === "submitted" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => autoJoinMutation.mutate()}
              disabled={autoJoinMutation.isPending}
              className="gap-1"
              data-testid={`button-auto-join-${group.id}`}
            >
              <MessageSquare className="h-3 w-3" />
              {autoJoinMutation.isPending ? "Joining..." : "Auto-Join"}
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(group)}
              data-testid={`button-view-${group.id}`}
            >
              View Details
            </Button>
          )}
        </div>
      </CardFooter>

      {group.status === "rejected" && group.rejectionReason && (
        <div className="px-6 pb-4">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-xs font-medium text-destructive mb-1">Rejection Reason</p>
            <p className="text-xs text-muted-foreground">{group.rejectionReason}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
