import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertGroupSchema, calculateGroupPrice, type Group } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PriceTable } from "@/components/price-table";
import { GroupCard } from "@/components/group-card";
import { Package, Loader2 } from "lucide-react";

const formSchema = insertGroupSchema.omit({
  members: true,
}).extend({
  groupAge: z.string().min(1, "Please select group age"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SellGroup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "single",
      link: "",
      description: "",
      groupAge: "",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group submitted!",
        description: "Your group has been submitted for verification.",
      });
      form.reset();
      setEstimatedPrice(null);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createGroupMutation.mutate(data);
  };

  const watchGroupAge = form.watch("groupAge");

  const handleCalculatePrice = () => {
    if (watchGroupAge) {
      const price = calculateGroupPrice(watchGroupAge);
      setEstimatedPrice(price);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sell Your Group</h1>
        <p className="text-muted-foreground">
          Submit your Telegram group for verification and get paid
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>
                Provide details about your Telegram group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                            data-testid="radio-group-type"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="single" id="single" data-testid="radio-single" />
                              <Label htmlFor="single" className="cursor-pointer">Single Group</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="folder" id="folder" data-testid="radio-folder" />
                              <Label htmlFor="folder" className="cursor-pointer">Folder of Groups</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://t.me/yourgroup"
                            {...field}
                            data-testid="input-group-link"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the Telegram invite link for your group
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your group..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Year</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-group-age">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2020">2020</SelectItem>
                            <SelectItem value="2021">2021</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the year your group was created
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createGroupMutation.isPending}
                      data-testid="button-submit-group"
                    >
                      {createGroupMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for Verification"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCalculatePrice}
                      disabled={!watchGroupAge}
                      data-testid="button-calculate-price"
                    >
                      Calculate Price
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <PriceTable />
        </div>

        <div className="space-y-6">
          {estimatedPrice !== null && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Estimated Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary mb-2" data-testid="text-estimated-price">
                  ${estimatedPrice.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on year {watchGroupAge}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Submit Your Group</p>
                  <p className="text-xs text-muted-foreground">Fill out the form with group details</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Verification</p>
                  <p className="text-xs text-muted-foreground">Admin verifies group authenticity</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Transfer Ownership</p>
                  <p className="text-xs text-muted-foreground">Transfer group to buyer</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  4
                </div>
                <div>
                  <p className="font-medium text-sm">Get Paid</p>
                  <p className="text-xs text-muted-foreground">Receive payment to your balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {groups && groups.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Submitted Groups</h2>
          {groupsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
