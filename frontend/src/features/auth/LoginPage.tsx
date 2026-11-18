import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { Button } from "../../components/ui";
import type { User } from "../../types/inventory";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(1, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<User>;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const submit = handleSubmit(async ({ email, password }) => {
    setError("");
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="bank-login-panel relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-32 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-12 h-[360px] w-[360px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <img
            src="/agricultural-development-bank-logo.png"
            alt="Agricultural Development Bank"
            className="h-14 w-16 rounded-lg bg-white object-contain p-1"
          />
          <div>
            <p className="font-bold">ADB Inventory</p>
            <p className="text-xs text-green-100">Inventory workspace</p>
          </div>
        </div>
        <div className="relative max-w-lg pb-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-green-100">
            Inventory, in control
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Know what you have. Keep work moving.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-green-50/80">
            A clear view of IT equipment, current stock, and every movement in
            your store room.
          </p>
          <div className="mt-10 flex gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Boxes size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold">One reliable stock view</p>
              <p className="mt-1 text-xs text-green-100">
                Track incoming and outgoing stock with confidence.
              </p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-green-100/70">
          Internal inventory workspace
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <img
              src="/agricultural-development-bank-logo.png"
              alt="Agricultural Development Bank"
              className="h-12 w-14 rounded-lg border border-slate-100 bg-white object-contain p-1"
            />
            <div>
              <p className="font-bold text-ink">ADB Inventory</p>
              <p className="text-xs text-muted">Inventory workspace</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted">
              Sign in with your organization account to continue.
            </p>
          </div>
          <form onSubmit={submit} noValidate className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Work email
              <input
                {...register("email")}
                type="email"
                autoComplete="username"
                placeholder="name@organization.org"
                className="bank-focus-input mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-normal outline-none transition placeholder:text-slate-400"
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-rose-600">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="bank-focus-input mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-normal outline-none transition placeholder:text-slate-400"
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-rose-600">
                  {errors.password.message}
                </span>
              )}
            </label>
            {error && (
              <p role="alert" className="text-sm text-rose-600">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="bank-primary-button h-12 w-full"
              disabled={submitting}
            >
              <LockKeyhole size={17} />
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-7 text-center text-xs leading-5 text-slate-400">
            Authentication is managed by your organization. Your credentials
            are never stored in this app.
          </p>
        </div>
      </section>
    </main>
  );
}
