import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, MessageSquare, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TelegramStatus {
  isConnected: boolean;
  isConfigured: boolean;
  username: string;
}

export function TelegramConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);

  const { data: status } = useQuery<TelegramStatus>({
    queryKey: ["/api/telegram/status"],
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/telegram/init", {
        apiId,
        apiHash,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      if (data.needsAuth) {
        setShowAuthForm(true);
        toast({
          title: "Credentials saved",
          description: "Now authenticate with your phone number",
        });
      } else {
        toast({
          title: "Success",
          description: "Telegram client initialized successfully",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize Telegram",
        variant: "destructive",
      });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/telegram/send-code", { phoneNumber });
    },
    onSuccess: (data: any) => {
      setPhoneCodeHash(data.phoneCodeHash);
      toast({
        title: "Code sent",
        description: "Check your Telegram app for the verification code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send code",
        variant: "destructive",
      });
    },
  });

  const authMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/telegram/auth", {
        phoneNumber,
        phoneCode,
        phoneCodeHash,
        password: password || undefined,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      setShowAuthForm(false);
      setPhoneCode("");
      setPassword("");
      toast({
        title: "Authenticated!",
        description: `Connected as ${data.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    },
  });

  const handleInit = () => {
    if (!apiId || !apiHash) {
      toast({
        title: "Missing credentials",
        description: "Please provide both API ID and API Hash",
        variant: "destructive",
      });
      return;
    }
    initMutation.mutate();
  };

  const handleSendCode = () => {
    if (!phoneNumber) {
      toast({
        title: "Missing phone number",
        description: "Please enter your phone number with country code",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate();
  };

  const handleAuth = () => {
    if (!phoneCode || !phoneCodeHash) {
      toast({
        title: "Missing code",
        description: "Please request a code first",
        variant: "destructive",
      });
      return;
    }
    authMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-telegram-status">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Telegram Bot Status
              </CardTitle>
              <CardDescription>
                Configure Telegram bot for automatic group joining
              </CardDescription>
            </div>
            <div>
              {status?.isConnected ? (
                <Badge variant="default" className="gap-1" data-testid="badge-connected">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1" data-testid="badge-disconnected">
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="rounded-lg bg-muted p-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="font-medium" data-testid="text-status">
                    {status.isConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Configured:</span>
                  <span className="font-medium" data-testid="text-configured">
                    {status.isConfigured ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Target Username:</span>
                  <span className="font-medium" data-testid="text-username">
                    {status.username}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!status?.isConnected && (
        <Card data-testid="card-telegram-config">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Telegram Configuration
            </CardTitle>
            <CardDescription>
              Get your API credentials from{" "}
              <a 
                href="https://my.telegram.org/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
                data-testid="link-telegram-apps"
              >
                https://my.telegram.org/apps
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiId">API ID</Label>
              <Input
                id="apiId"
                type="text"
                placeholder="Enter your API ID"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                data-testid="input-api-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiHash">API Hash</Label>
              <Input
                id="apiHash"
                type="text"
                placeholder="Enter your API Hash"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                data-testid="input-api-hash"
              />
            </div>
            <Button 
              onClick={handleInit} 
              disabled={initMutation.isPending}
              className="w-full"
              data-testid="button-save-credentials"
            >
              {initMutation.isPending ? "Saving..." : "Save Credentials"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showAuthForm && !status?.isConnected && (
        <Card data-testid="card-telegram-auth">
          <CardHeader>
            <CardTitle>Authenticate Account</CardTitle>
            <CardDescription>
              Verify your Telegram account to enable bot functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone"
              />
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +1 for USA)
              </p>
            </div>
            <Button 
              onClick={handleSendCode} 
              disabled={sendCodeMutation.isPending}
              className="w-full"
              data-testid="button-send-code"
            >
              {sendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
            </Button>

            {phoneCodeHash && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phoneCode">Verification Code</Label>
                  <Input
                    id="phoneCode"
                    type="text"
                    placeholder="Enter code from Telegram"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    data-testid="input-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">2FA Password (if enabled)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter 2FA password (optional)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  onClick={handleAuth} 
                  disabled={authMutation.isPending}
                  className="w-full"
                  data-testid="button-authenticate"
                >
                  {authMutation.isPending ? "Authenticating..." : "Authenticate"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
