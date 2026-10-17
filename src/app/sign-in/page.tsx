"use client";

import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@school.local" },
  { label: "Teacher", email: "teacher@school.local" },
  { label: "Student", email: "student@school.local" },
  { label: "Parent", email: "parent@school.local" },
] as const;

const DEMO_PASSWORD = "password123";

const LoginPage = () => {
  const router = useRouter();
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    setAccountCreated(new URLSearchParams(window.location.search).get("created") === "1");
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7FBFA] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-md bg-white p-5 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-500">
          Use your school account to continue.
        </p>
        {accountCreated && (
          <p className="mt-3 text-sm text-green-600">
            Account created. Sign in with your new email.
          </p>
        )}
        <label className="mt-6 flex flex-col gap-2 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-sky-200"
            required
          />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Password
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 p-3 pr-10 outline-none focus:ring-2 focus:ring-sky-200"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-sky-500 p-3 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Demo accounts
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Click one to fill the form. Password for all:{" "}
            <span className="font-mono text-gray-700">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-xs transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="block font-medium text-gray-700">
                  {account.label}
                </span>
                <span className="block truncate text-gray-400">
                  {account.email}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <Link href="/forgot-password" className="text-sky-600 hover:underline">
            Forgot password
          </Link>
          <Link href="/sign-up" className="text-sky-600 hover:underline">
            Create parent account
          </Link>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;
