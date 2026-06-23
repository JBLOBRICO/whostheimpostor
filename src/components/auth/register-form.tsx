"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { registerUser } from "@/lib/actions/auth";
import Link from "next/link";
import { Mail, Lock, User, Sparkles } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("displayName", formData.displayName);

      const result = await registerUser(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="text-5xl mb-3 animate-float inline-block">🎮</div>
        <h1 className="text-3xl font-black gradient-text">Create Account</h1>
        <p className="text-white/50 mt-1">Join the deception — it&apos;s free!</p>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>New Agent Registration</CardTitle>
          <CardDescription>Choose your identity carefully...</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              placeholder="Agent Shadow"
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
              icon={<User className="w-4 h-4" />}
              required
              minLength={2}
              maxLength={20}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="agent@example.com"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="game"
              size="lg"
              loading={loading}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Account & Play
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </Link>
          </div>

          <p className="mt-3 text-xs text-white/30 text-center">
            By creating an account, you agree to play fair and have a great time 🎭
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
