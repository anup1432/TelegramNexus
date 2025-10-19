import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { GroupCard } from "@/components/group-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Package, DollarSign, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Group } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: stats } = useQuery<{
    totalEarnings: number;
    pendingGroups: number;
    completedGroups: number;
    availableBalance: number;
  }>({
    queryKey: ["/api/groups/stats"],
  });

  const { data: telegramUsername } = useQuery<{ username: string }>({
    queryKey: ["/api/telegram/username"],
  });

  const recentGroups = groups?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your group listings
        </p>
      </div>

      {telegramUsername && telegramUsername.username !== "Not configured" && (
        <Card className="border-primary/20 bg-primary/5" data-testid="card-transfer-info">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Ownership Transfer Target Account
                </p>
                <p className="text-lg font-semibold" data-testid="text-target-username">
                  @{telegramUsername.username}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.totalEarnings.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          description="All-time earnings"
        />
        <StatsCard
          title="Pending Groups"
          value={stats?.pendingGroups || 0}
          icon={Clock}
          description="Awaiting review"
        />
        <StatsCard
          title="Completed"
          value={stats?.completedGroups || 0}
          icon={CheckCircle2}
          description="Successfully sold"
        />
        <StatsCard
          title="Available Balance"
          value={`$${stats?.availableBalance.toFixed(2) || "0.00"}`}
          icon={Package}
          description="Ready for withdrawal"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Get started with common tasks</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button
          size="lg"
          className="h-auto py-6 justify-start"
          onClick={() => setLocation("/sell-group")}
          data-testid="button-sell-group"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-base">Sell Your Group</p>
              <p className="text-xs opacity-90">Submit a new group for verification</p>
            </div>
          </div>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-auto py-6 justify-start"
          onClick={() => setLocation("/earnings")}
          data-testid="button-view-earnings"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-base">View Earnings</p>
              <p className="text-xs text-muted-foreground">Check your balance and withdraw</p>
            </div>
          </div>
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Groups</h2>
          {groups && groups.length > 3 && (
            <Button
              variant="ghost"
              onClick={() => setLocation("/sell-group")}
              data-testid="button-view-all"
            >
              View all
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : recentGroups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No groups yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by submitting your first Telegram group
            </p>
            <Button onClick={() => setLocation("/sell-group")} data-testid="button-get-started">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
