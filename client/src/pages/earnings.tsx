import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertWithdrawalSchema, type Withdrawal } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormValues = z.infer<typeof insertWithdrawalSchema>;

export default function Earnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: withdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: stats } = useQuery<{
    totalEarnings: number;
    pendingWithdrawals: number;
    completedWithdrawals: number;
  }>({
    queryKey: ["/api/withdrawals/stats"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertWithdrawalSchema),
    defaultValues: {
      amount: "0",
      method: "",
      details: "",
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/withdrawals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Withdrawal requested!",
        description: "Your withdrawal request has been submitted for approval.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to create withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createWithdrawalMutation.mutate(data);
  };

  const availableBalance = parseFloat(user?.balance || "0");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Earnings & Withdrawals</h1>
          <p className="text-muted-foreground">
            Track your earnings and request withdrawals
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-withdrawal">
              <Wallet className="w-4 h-4 mr-2" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Submit a withdrawal request. Admin will review and process it.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-withdrawal-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        Available balance: ${availableBalance.toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your payment details (UPI ID, wallet address, account number, etc.)"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-payment-details"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createWithdrawalMutation.isPending}
                  data-testid="button-submit-withdrawal"
                >
                  {createWithdrawalMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Available Balance"
          value={`$${availableBalance.toFixed(2)}`}
          icon={Wallet}
          description="Ready for withdrawal"
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.totalEarnings.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          description="All-time earnings"
        />
        <StatsCard
          title="Pending Requests"
          value={stats?.pendingWithdrawals || 0}
          icon={Clock}
          description="Awaiting approval"
        />
        <StatsCard
          title="Completed"
          value={stats?.completedWithdrawals || 0}
          icon={CheckCircle2}
          description="Successfully processed"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            Track your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals && withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`withdrawal-${withdrawal.id}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`rounded-full p-2 ${
                      withdrawal.status === "approved" 
                        ? "bg-chart-2/10" 
                        : withdrawal.status === "rejected" 
                        ? "bg-destructive/10" 
                        : "bg-muted"
                    }`}>
                      {withdrawal.status === "approved" ? (
                        <CheckCircle2 className="w-5 h-5 text-chart-2" />
                      ) : withdrawal.status === "rejected" ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">
                          ${parseFloat(withdrawal.amount).toFixed(2)}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {withdrawal.method}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested on {new Date(withdrawal.requestedAt).toLocaleDateString()}
                      </p>
                      {withdrawal.status === "rejected" && withdrawal.rejectionReason && (
                        <p className="text-xs text-destructive mt-1">
                          Reason: {withdrawal.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={withdrawal.status as any} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No withdrawal requests yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your withdrawal history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
