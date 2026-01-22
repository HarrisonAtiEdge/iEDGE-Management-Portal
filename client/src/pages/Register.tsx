import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "" as UserRole | ""
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.displayName || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await register(formData.email, formData.password, formData.displayName, formData.role);
      setLocation("/login");
      toast({
        title: "Registration Successful",
        description: "Your account has been created and is pending approval by the main administrator.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = [
    { value: "operation", label: "Operation" },
    { value: "finance", label: "Finance" },
    { value: "operational_admin", label: "Operational Admin" },
    { value: "financial_admin", label: "Financial Admin" },
    { value: "main_admin", label: "Main Admin" },
    { value: "sales", label: "Sales" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-file-invoice-dollar text-primary text-3xl"></i>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Register for invoice management system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your full name"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                required
                data-testid="input-displayname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value as UserRole})}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-register"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
