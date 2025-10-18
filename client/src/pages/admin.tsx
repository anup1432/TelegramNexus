import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Group, Withdrawal, User, PriceConfig, AdminSetting } from "@shared/schema";
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
  ExternalLink,
  Edit,
  Trash2,
  Settings as SettingsIcon,
  Tag,
  Shield
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
import { Badge } from "@/components/ui/badge";

interface UserWithoutPassword extends Omit<User, 'password'> {}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Group state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Withdrawal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [withdrawalRejectionReason, setWithdrawalRejectionReason] = useState("");
  
  // User state
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [editUserBalance, setEditUserBalance] = useState("");
  
  // Price state
  const [editingPrice, setEditingPrice] = useState<PriceConfig | null>(null);
  const [newPriceValue, setNewPriceValue] = useState("");
  
  // Settings state
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" });
  const [editingSetting, setEditingSetting] = useState<AdminSetting | null>(null);

  // Queries
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/admin/groups"],
  });

  const { data: withdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const { data: users } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: prices } = useQuery<PriceConfig[]>({
    queryKey: ["/api/admin/prices"],
  });

  const { data: settings } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: stats } = useQuery<{
    totalGroups: number;
    totalUsers: number;
    totalEarnings: number;
    pendingReviews: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  // Group mutations
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

  // Withdrawal mutations
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

  // User mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isAdmin, balance }: { userId: string; isAdmin?: number; balance?: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin, balance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
      setSelectedUser(null);
      setEditUserBalance("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Price mutations
  const updatePriceMutation = useMutation({
    mutationFn: async ({ priceId, price }: { priceId: string; price: string }) => {
      return await apiRequest("PATCH", `/api/admin/prices/${priceId}`, { price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prices"] });
      toast({
        title: "Price updated",
        description: "Price has been updated successfully.",
      });
      setEditingPrice(null);
      setNewPriceValue("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update price",
        variant: "destructive",
      });
    },
  });

  // Settings mutations
  const saveSettingMutation = useMutation({
    mutationFn: async (setting: { settingKey: string; settingValue: string; description?: string }) => {
      return await apiRequest("POST", "/api/admin/settings", setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Setting saved",
        description: "Setting has been saved successfully.",
      });
      setNewSetting({ key: "", value: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save setting",
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest("PATCH", `/api/admin/settings/${key}`, { settingValue: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Setting updated",
        description: "Setting has been updated successfully.",
      });
      setEditingSetting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiRequest("DELETE", `/api/admin/settings/${key}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Setting deleted",
        description: "Setting has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete setting",
        variant: "destructive",
      });
    },
  });

  // Handlers
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

  const handleToggleAdmin = (user: UserWithoutPassword) => {
    const newAdminStatus = user.isAdmin === 1 ? 0 : 1;
    updateUserMutation.mutate({ userId: user.id, isAdmin: newAdminStatus });
  };

  const handleUpdateUserBalance = () => {
    if (!selectedUser || !editUserBalance) return;
    updateUserMutation.mutate({ userId: selectedUser.id, balance: editUserBalance });
  };

  const handleUpdatePrice = () => {
    if (!editingPrice || !newPriceValue) return;
    updatePriceMutation.mutate({ priceId: editingPrice.id, price: newPriceValue });
  };

  const handleSaveNewSetting = () => {
    if (!newSetting.key || !newSetting.value) {
      toast({
        title: "Missing fields",
        description: "Setting key and value are required",
        variant: "destructive",
      });
      return;
    }
    saveSettingMutation.mutate({
      settingKey: newSetting.key,
      settingValue: newSetting.value,
      description: newSetting.description,
    });
  };

  const handleUpdateSetting = () => {
    if (!editingSetting) return;
    updateSettingMutation.mutate({ key: editingSetting.settingKey, value: editingSetting.settingValue });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Comprehensive platform management and configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Groups"
          value={stats?.totalGroups || 0}
          icon={Package}
          description="All submitted groups"
          data-testid="stat-total-groups"
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Registered users"
          data-testid="stat-total-users"
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.totalEarnings?.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          description="Platform earnings"
          data-testid="stat-total-earnings"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          icon={Clock}
          description="Awaiting action"
          data-testid="stat-pending-reviews"
        />
      </div>

      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="groups" data-testid="tab-groups">Groups</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="prices" data-testid="tab-prices">Pricing</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Group Submissions</CardTitle>
              <CardDescription>
                Review and manage all group submissions with ownership tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Group Link</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
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
                          <TableCell>
                            <Badge variant="outline">{group.type}</Badge>
                          </TableCell>
                          <TableCell>{group.members.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{group.groupAge || "—"}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${group.price ? parseFloat(group.price).toFixed(2) : "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={group.status as any} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(group.submittedAt).toLocaleDateString()}
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
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users, balances, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Telegram ID</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-mono text-xs">
                            {user.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.telegramId || "—"}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${parseFloat(user.balance).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {user.isAdmin === 1 ? (
                              <Badge className="bg-purple-500">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserBalance(user.balance);
                                }}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={user.isAdmin === 1 ? "destructive" : "default"}
                                onClick={() => handleToggleAdmin(user)}
                                data-testid={`button-toggle-admin-${user.id}`}
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm(`Delete user ${user.username}?`)) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
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
                      <TableHead>Requested</TableHead>
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
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

        {/* Prices Tab */}
        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>
                <Tag className="w-5 h-5 inline-block mr-2" />
                Price Configuration
              </CardTitle>
              <CardDescription>
                Edit pricing based on group age and member count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Age</TableHead>
                      <TableHead>Member Range</TableHead>
                      <TableHead>Price (USD)</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices && prices.length > 0 ? (
                      prices.map((price) => (
                        <TableRow key={price.id} data-testid={`row-price-${price.id}`}>
                          <TableCell className="font-medium">{price.groupAge}</TableCell>
                          <TableCell>{price.memberRange}</TableCell>
                          <TableCell className="font-semibold text-primary text-lg">
                            ${parseFloat(price.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(price.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPrice(price);
                                setNewPriceValue(price.price);
                              }}
                              data-testid={`button-edit-price-${price.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No price configurations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <SettingsIcon className="w-5 h-5 inline-block mr-2" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Manage Telegram API credentials and platform configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new setting */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-4">Add New Setting</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="new-setting-key">Setting Key</Label>
                      <Input
                        id="new-setting-key"
                        placeholder="e.g., TELEGRAM_API_ID"
                        value={newSetting.key}
                        onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                        data-testid="input-new-setting-key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-setting-value">Setting Value</Label>
                      <Input
                        id="new-setting-value"
                        placeholder="Enter value"
                        value={newSetting.value}
                        onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                        data-testid="input-new-setting-value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-setting-description">Description (Optional)</Label>
                      <Input
                        id="new-setting-description"
                        placeholder="Brief description"
                        value={newSetting.description}
                        onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                        data-testid="input-new-setting-description"
                      />
                    </div>
                    <Button
                      onClick={handleSaveNewSetting}
                      disabled={saveSettingMutation.isPending}
                      data-testid="button-save-new-setting"
                    >
                      {saveSettingMutation.isPending ? "Saving..." : "Save Setting"}
                    </Button>
                  </div>
                </div>

                {/* Existing settings */}
                <div>
                  <h3 className="font-semibold mb-4">Current Settings</h3>
                  <div className="space-y-3">
                    {settings && settings.length > 0 ? (
                      settings.map((setting) => (
                        <div
                          key={setting.id}
                          className="border rounded-lg p-4 flex items-start justify-between"
                          data-testid={`setting-${setting.settingKey}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium font-mono text-sm">{setting.settingKey}</div>
                            <div className="text-muted-foreground text-sm mt-1">
                              {setting.settingValue}
                            </div>
                            {setting.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {setting.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Updated: {new Date(setting.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSetting(setting)}
                              data-testid={`button-edit-setting-${setting.settingKey}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Delete setting ${setting.settingKey}?`)) {
                                  deleteSettingMutation.mutate(setting.settingKey);
                                }
                              }}
                              data-testid={`button-delete-setting-${setting.settingKey}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No settings configured. Add your first setting above.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      
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

      {/* Edit User Balance Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Balance</DialogTitle>
            <DialogDescription>
              Update balance for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-balance">Balance (USD)</Label>
              <Input
                id="user-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editUserBalance}
                onChange={(e) => setEditUserBalance(e.target.value)}
                data-testid="input-user-balance"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUserBalance}
              disabled={updateUserMutation.isPending}
              data-testid="button-update-user-balance"
            >
              {updateUserMutation.isPending ? "Updating..." : "Update Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingPrice} onOpenChange={() => setEditingPrice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
            <DialogDescription>
              Update price for {editingPrice?.groupAge} ({editingPrice?.memberRange})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price-value">Price (USD)</Label>
              <Input
                id="price-value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPriceValue}
                onChange={(e) => setNewPriceValue(e.target.value)}
                data-testid="input-price-value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrice(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatePriceMutation.isPending}
              data-testid="button-update-price"
            >
              {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Setting Dialog */}
      <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update value for {editingSetting?.settingKey}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="setting-value">Setting Value</Label>
              <Input
                id="setting-value"
                placeholder="Enter new value"
                value={editingSetting?.settingValue || ""}
                onChange={(e) => 
                  setEditingSetting(editingSetting ? { ...editingSetting, settingValue: e.target.value } : null)
                }
                data-testid="input-setting-value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSetting(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSetting}
              disabled={updateSettingMutation.isPending}
              data-testid="button-update-setting"
            >
              {updateSettingMutation.isPending ? "Updating..." : "Update Setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
