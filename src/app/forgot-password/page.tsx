import Link from "next/link";

const ForgotPasswordPage = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7FBFA] p-4">
      <div className="w-full max-w-md rounded-md bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-3 text-sm text-gray-600">
          Password reset emails are not configured in this demo. Sign in with a
          demo account on the sign-in page, or ask an administrator to change
          your password.
        </p>
        <Link
          href="/sign-in"
          className="btn mt-6 inline-block bg-sky-500 px-4 py-2 text-sm font-medium text-white"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
