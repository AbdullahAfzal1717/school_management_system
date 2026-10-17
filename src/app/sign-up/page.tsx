"use client";

import { signUp } from "@/app/actions/account";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const SignUpPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await signUp({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push("/sign-in?created=1");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7FBFA] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-md bg-white p-5 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold">Create a parent account</h1>
        <p className="mt-2 text-sm text-gray-500">
          New accounts are created as parents. Student and teacher accounts are
          issued by an administrator.
        </p>
        <label className="mt-6 flex flex-col gap-2 text-sm">
          First name
          <input name="firstName" required className="rounded-md border border-gray-300 p-3" />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Last name
          <input name="lastName" required className="rounded-md border border-gray-300 p-3" />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Email
          <input name="email" type="email" required className="rounded-md border border-gray-300 p-3" />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Phone
          <input name="phone" className="rounded-md border border-gray-300 p-3" />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Password
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="rounded-md border border-gray-300 p-3"
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="btn mt-6 w-full bg-sky-500 p-3 font-medium text-white"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
        <Link href="/sign-in" className="mt-4 block text-center text-sm text-sky-600">
          Back to sign in
        </Link>
      </form>
    </main>
  );
};

export default SignUpPage;
