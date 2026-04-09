import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LineChart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register, isLoading, user } = useAuth();
  // If user is already logged in, redirect to home
  if (user) {
    setLocation("/");
    return null;
  }

  const [activeTab, setActiveTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRepeatPassword, setRegisterRepeatPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      toast.success("Welcome back!");
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerRepeatPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await register(registerEmail, registerPassword, registerRepeatPassword, registerFullName);
      toast.success("Account created! Please log in.");
      // Switch to login tab after successful registration
      setActiveTab("login");
      // Pre-fill login email for convenience
      setLoginEmail(registerEmail);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 transition-opacity hover:opacity-80 cursor-pointer">
        <div className="bg-primary/10 p-2 rounded-xl">
          <LineChart className="w-8 h-8 text-primary" />
        </div>
        <span className="font-display font-bold text-3xl tracking-tight">
          Ticker<span className="text-primary">Track</span>
        </span>
      </Link>

      <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/50 backdrop-blur-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your details to log in to your account
              </CardDescription>
            </TabsContent>
            <TabsContent value="register" className="text-center">
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription>
                Fill in the form to register in the system
              </CardDescription>
            </TabsContent>
          </CardHeader>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    required 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Full Name</Label>
                  <Input 
                    id="register-fullname" 
                    placeholder="John Doe" 
                    required 
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    required 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-repeat-password">Confirm Password</Label>
                  <Input 
                    id="register-repeat-password" 
                    type="password" 
                    required 
                    value={registerRepeatPassword}
                    onChange={(e) => setRegisterRepeatPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
