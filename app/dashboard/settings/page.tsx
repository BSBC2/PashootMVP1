"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, User, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBillingPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and subscription
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed after signup
            </p>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Billing & Subscription</CardTitle>
          </div>
          <CardDescription>
            Manage your subscription and payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Professional Plan</p>
              <p className="text-sm text-gray-600">$12/month</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              Active
            </span>
          </div>
          <Button onClick={handleBillingPortal} disabled={isLoading}>
            {isLoading ? "Loading..." : "Manage Subscription"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Opens Stripe billing portal where you can update payment methods, view invoices, and cancel your subscription
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
