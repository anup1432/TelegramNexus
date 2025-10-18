import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, HelpCircle, FileText } from "lucide-react";

export default function Support() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Support & Help</h1>
        <p className="text-muted-foreground">
          Get help with your account and group submissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Reach out to our support team for assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available to help with any questions or issues you may have.
            </p>
            <Button variant="outline" className="w-full" data-testid="button-contact-support">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="rounded-lg bg-chart-3/10 w-12 h-12 flex items-center justify-center mb-3">
              <HelpCircle className="w-6 h-6 text-chart-3" />
            </div>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>
              Find answers to commonly asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our frequently asked questions for quick answers.
            </p>
            <Button variant="outline" className="w-full" data-testid="button-view-faq">
              <FileText className="w-4 h-4 mr-2" />
              View FAQ
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              How long does verification take?
            </h3>
            <p className="text-sm text-muted-foreground">
              Verification typically takes 24-48 hours. Our admin team carefully reviews each submission
              to ensure authenticity and compliance with our guidelines.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              When will I receive payment?
            </h3>
            <p className="text-sm text-muted-foreground">
              Once your group is successfully transferred and approved, the payment is added to your
              balance immediately. You can then request a withdrawal, which will be processed within
              2-5 business days.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              What if my group is rejected?
            </h3>
            <p className="text-sm text-muted-foreground">
              If your group is rejected, you'll see the reason in your submissions list. You can address
              the issues and resubmit. Common rejection reasons include invalid links, inaccurate member
              counts, or groups that don't meet our criteria.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              How do I reset my password?
            </h3>
            <p className="text-sm text-muted-foreground">
              Please contact our support team via email for manual password recovery. We'll verify your
              identity and help you regain access to your account.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              What payment methods are supported?
            </h3>
            <p className="text-sm text-muted-foreground">
              We support multiple payment methods including UPI, cryptocurrency, bank transfer, and PayPal.
              You can specify your preferred method when requesting a withdrawal.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Still need help?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Can't find what you're looking for? Contact our support team directly.
              </p>
              <Button data-testid="button-get-help">
                Get Help Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
