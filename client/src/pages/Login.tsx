// import { useState } from "react";
// import { useLocation } from "wouter";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";

// import { auth } from "@/lib/firebase";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// const PANEL_ID = "IEDGE-SYSTEM";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (!email || !password) {
//       toast({
//         title: "Error",
//         description: "Please fill in all fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       // 1) Login with Firebase Auth
//       const userCred = await signInWithEmailAndPassword(auth, email, password);
//       const uid = userCred.user.uid;

//       // 2) Fetch user data from Firestore (✅ PANEL PATH)
//       const userDocRef = doc(db, "Panels", PANEL_ID, "users", uid);
//       const userDoc = await getDoc(userDocRef);

//       if (!userDoc.exists()) {
//         await auth.signOut();
//         throw new Error("User record not found in this panel.");
//       }

//       const userData = userDoc.data();

//       // 3) BLOCK LOGIN → User is inactive
//       if (userData?.isActive === false) {
//         await auth.signOut();
//         throw new Error("Your account has been deactivated. Contact admin.");
//       }

//       // 4) BLOCK LOGIN → Account is not approved
//       if (userData?.accountStatus !== "approved") {
//         await auth.signOut();
//         throw new Error("Your account is not approved by the admin yet.");
//       }

//       // 5) Save role (✅ use role field, not isAdmin)
//       localStorage.setItem("role", userData?.role ?? "");

//       toast({
//         title: "Success",
//         description: "Logged in successfully",
//       });

//       setLocation("/dashboard");
//     } catch (error: any) {
//       toast({
//         title: "Login Failed",
//         description: error.message || "Invalid email or password",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background px-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex items-center justify-center mb-4">
//             <i className="fas fa-file-invoice-dollar text-primary text-3xl"></i>
//           </div>
//           <CardTitle className="text-2xl font-bold">iEDGE Management System</CardTitle>
//           <CardDescription>Sign in to your account</CardDescription>
//         </CardHeader>

//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? (
//                 <>
//                   <i className="fas fa-spinner fa-spin mr-2"></i>
//                   Signing In...
//                 </>
//               ) : (
//                 "Sign In"
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PANEL_ID = "IEDGE-SYSTEM";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);

  // ✅ Forgot password states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 1) Login with Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // 2) Fetch user data from Firestore (✅ PANEL PATH)
      const userDocRef = doc(db, "Panels", PANEL_ID, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await auth.signOut();
        throw new Error("User record not found in this panel.");
      }

      const userData = userDoc.data();

      // 3) BLOCK LOGIN → User is inactive
      if (userData?.isActive === false) {
        await auth.signOut();
        throw new Error("Your account has been deactivated. Contact admin.");
      }

      // 4) BLOCK LOGIN → Account is not approved
      if (userData?.accountStatus !== "approved") {
        await auth.signOut();
        throw new Error("Your account is not approved by the admin yet.");
      }

      // 5) Save role (✅ use role field, not isAdmin)
      localStorage.setItem("role", userData?.role ?? "");

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ✅ Forgot password handler (Option A)
  async function handlePasswordReset() {
    const emailToReset = resetEmail.trim();

    if (!emailToReset) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, emailToReset);

      toast({
        title: "Reset link sent",
        description:
          "If an account exists for this email, you will receive a password reset link shortly.",
      });

      setForgotOpen(false);
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description:
          error?.message || "Could not send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-file-invoice-dollar text-primary text-3xl"></i>
          </div>
          <CardTitle className="text-2xl font-bold">
            iEDGE Management System
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* ✅ Forgot password button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm underline underline-offset-4 hover:opacity-80"
                  onClick={() => {
                    setResetEmail(email || "");
                    setForgotOpen(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* ✅ Forgot Password Dialog */}
          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset password</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handlePasswordReset}
                  disabled={resetLoading || !resetEmail.trim()}
                >
                  {resetLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
