// import { useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Link, useLocation } from "wouter";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
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
//       await login(email, password);
//       setLocation("/dashboard");
//       toast({
//         title: "Success",
//         description: "Logged in successfully",
//       });
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
//           <CardTitle className="text-2xl font-bold">Invoice Management</CardTitle>
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
//                 data-testid="input-email"
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
//                 data-testid="input-password"
//               />
//             </div>
//             <Button
//               type="submit"
//               className="w-full"
//               disabled={loading}
//               data-testid="button-login"
//             >
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
//           <div className="mt-4 text-center">
//             <p className="text-sm text-muted-foreground">
//               Don't have an account?{" "}
//               <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
//                 Register here
//               </Link>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


// import { useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Link, useLocation } from "wouter";
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

//       // 1. Login with Firebase Auth
//       const userCred = await signInWithEmailAndPassword(auth, email, password);
//       const uid = userCred.user.uid;

//       // 2. Fetch user data from Firestore
//       const userDoc = await getDoc(doc(db, "users", uid));

//       if (!userDoc.exists()) {
//         await auth.signOut();
//         throw new Error("User record not found.");
//       }

//       const userData = userDoc.data();

//       // 3. BLOCK LOGIN → User is inactive
//       if (userData?.isActive === false) {
//         await auth.signOut();
//         throw new Error("Your account has been deactivated. Contact admin.");
//       }

//       // 4. BLOCK LOGIN → Account is not approved
//       if (userData?.accountStatus !== "approved") {
//         await auth.signOut();
//         throw new Error("Your account is not approved by the admin yet.");
//       }

//       // 5. Login success
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
//           <CardTitle className="text-2xl font-bold">Invoice Management</CardTitle>
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PANEL_ID = "IEDGE-SYSTEM";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-file-invoice-dollar text-primary text-3xl"></i>
          </div>
          <CardTitle className="text-2xl font-bold">Invoice Management</CardTitle>
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
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
        </CardContent>
      </Card>
    </div>
  );
}
