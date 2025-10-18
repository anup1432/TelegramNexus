import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Group, Withdrawal, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { StatsCard } from "@/components/stats-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [withdrawalRejectionReason, setWithdrawalRejectionReason] = useState("");

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/admin/groups"],
  });

  const { data: withdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const { data: stats } = useQuery<{
    totalGroups: number;
    totalUsers: number;
    totalEarnings: number;
    pendingReviews: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, status, reason }: { groupId: string; status: string; reason?: string }) => {
      return await apiRequest("PATCH", `/api/admin/groups/${groupId}`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Group updated",
        description: "Group status has been updated successfully.",
      });
      setSelectedGroup(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update group",
        variant: "destructive",
      });
    },
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, status, reason }: { withdrawalId: string; status: string; reason?: string }) => {
      return await apiRequest("PATCH", `/api/admin/withdrawals/${withdrawalId}`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: "Withdrawal updated",
        description: "Withdrawal status has been updated successfully.",
      });
      setSelectedWithdrawal(null);
      setWithdrawalRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleApproveGroup = (group: Group) => {
    updateGroupMutation.mutate({ groupId: group.id, status: "paid" });
  };

  const handleRejectGroup = (group: Group) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    updateGroupMutation.mutate({ 
      groupId: group.id, 
      status: "rejected", 
      reason: rejectionReason 
    });
  };

  const handleApproveWithdrawal = (withdrawal: Withdrawal) => {
    updateWithdrawalMutation.mutate({ withdrawalId: withdrawal.id, status: "approved" });
  };

  const handleRejectWithdrawal = (withdrawal: Withdrawal) => {
    if (!withdrawalRejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    updateWithdrawalMutation.mutate({ 
      withdrawalId: withdrawal.id, 
      status: "rejected", 
      reason: withdrawalRejectionReason 
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage groups, withdrawals, and users
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Groups"
          value={stats?.totalGroups || 0}
          icon={Package}
          description="All submitted groups"
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Registered users"
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.totalEarnings?.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          description="Platform earnings"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          icon={Clock}
          description="Awaiting action"
        />
      </div>

      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="groups" data-testid="tab-groups">Groups</TabsTrigger>
          <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Group Submissions</CardTitle>
              <CardDescription>
                Review and manage all group submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Group Link</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups && groups.length > 0 ? (
                      groups.map((group) => (
                        <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                          <TableCell className="font-medium font-mono text-xs">
                            {group.ownerId.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <a
                              href={group.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-xs font-mono"
                            >
                              <span className="max-w-[200px] truncate">{group.link}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </TableCell>
                          <TableCell>{group.members.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{group.groupAge || "—"}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${group.price ? parseFloat(group.price).toFixed(2) : "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={group.status as any} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {group.status !== "paid" && group.status !== "rejected" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveGroup(group)}
                                    data-testid={`button-approve-${group.id}`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setSelectedGroup(group)}
                                    data-testid={`button-reject-${group.id}`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No groups found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                Review and process withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals && withdrawals.length > 0 ? (
                      withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} data-testid={`row-withdrawal-${withdrawal.id}`}>
                          <TableCell className="font-medium font-mono text-xs">
                            {withdrawal.userId.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${parseFloat(withdrawal.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="capitalize">{withdrawal.method}</TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {withdrawal.details}
                            </p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={withdrawal.status as any} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {withdrawal.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveWithdrawal(withdrawal)}
                                    data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setSelectedWithdrawal(withdrawal)}
                                    data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No withdrawal requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Rejection Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Group</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this group submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGroup(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedGroup && handleRejectGroup(selectedGroup)}
              disabled={updateGroupMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {updateGroupMutation.isPending ? "Rejecting..." : "Reject Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Rejection Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this withdrawal request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawal-rejection-reason">Rejection Reason</Label>
              <Textarea
                id="withdrawal-rejection-reason"
                placeholder="Enter reason for rejection..."
                value={withdrawalRejectionReason}
                onChange={(e) => setWithdrawalRejectionReason(e.target.value)}
                rows={4}
                data-testid="input-withdrawal-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedWithdrawal && handleRejectWithdrawal(selectedWithdrawal)}
              disabled={updateWithdrawalMutation.isPending}
              data-testid="button-confirm-reject-withdrawal"
            >
              {updateWithdrawalMutation.isPending ? "Rejecting..." : "Reject Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
