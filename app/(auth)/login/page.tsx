"use client";

import { ArrowRight, Code2, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { devLogin } from "@/app/(auth)/login/_actions/dev-login";
import { createClient } from "@/lib/auth/client";

const isDev = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setMessage({ type: "error", text: "Veuillez saisir une adresse email." });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // If we are in local development without actual Supabase config, bypass with success
      const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isMock) {
        // Wait 1s to simulate network request
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setMessage({
          type: "success",
          text: "Connexion simulée réussie ! Redirection en cours...",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: emailTrimmed,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          throw error;
        }

        setMessage({
          type: "success",
          text: "Magic link envoyé ! Vérifiez votre boîte mail.",
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Une erreur inconnue est survenue.";
      setMessage({
        type: "error",
        text:
          errorMessage ||
          "Une erreur est survenue lors de l'envoi du Magic Link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0B0D] px-4 selection:bg-[#F5C518] selection:text-black">
      {/* Dynamic Background subtle overlay */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(91,141,239,0.05)_0%,transparent_60%] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1F232B] to-transparent" />

      <div className="w-full max-w-md z-10">
        {/* Logo and Headings */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1F232B] bg-[#111317] text-xs font-mono text-[#9AA0A6] mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>PORTAL GOUVERNÉ v2.0</span>
          </div>

          <h1
            id="login-title"
            className="text-3xl font-extrabold tracking-tight text-[#E8EAED] font-sans"
          >
            Maeva Deal{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5C518] to-[#5B8DEF]">
              Radar Room
            </span>
          </h1>
          <p className="text-xs text-[#9AA0A6] mt-2 font-mono uppercase tracking-wider">
            Cockpit institutionnel M&A & Private Equity
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[#16191F]/80">
          {/* Subtle gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F5C518] to-[#5B8DEF]" />

          <p className="text-sm text-[#9AA0A6] mb-6">
            Saisissez votre email professionnel. Aucun mot de passe requis — un
            lien de connexion sécurisé vous sera envoyé par email.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-xs font-mono uppercase tracking-wider text-[#E8EAED]"
              >
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AA0A6]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="maeva@dealradar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-sm text-[#E8EAED] placeholder-[#9AA0A6]/40 focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F5C518] to-[#5B8DEF] text-[#0A0B0D] font-bold text-sm rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>Demander mon Magic Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {isDev && (
            <form action={devLogin} className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[#5B8DEF]/40 bg-[#5B8DEF]/5 text-[#5B8DEF] font-semibold text-xs rounded-lg hover:bg-[#5B8DEF]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                Accès développeur
              </button>
            </form>
          )}

          {/* Feedback Messages */}
          {message && (
            <div
              id="login-feedback-message"
              className={`mt-6 p-4 rounded-lg border text-sm font-sans transition-all duration-300 animate-fadeIn ${
                message.type === "success"
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                  : "bg-rose-950/20 border-rose-800/40 text-rose-400"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                </div>
                <div>{message.text}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] font-mono text-[#9AA0A6]/50">
          <p>© 2026 Maeva Deal Radar Room. All rights reserved.</p>
          <p className="mt-1">Secured with Supabase Auth & RLS policies.</p>
        </div>
      </div>
    </main>
  );
}
