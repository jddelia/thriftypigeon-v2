export const metadata = {
  title: "Subscribe",
  description: "Join the Thrifty Pigeon newsletter for tactical money moves.",
};

export default function SubscribePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Stay ahead of the flock</h1>
      <p className="mt-3 text-slate-600">
        Double opt-in and zero spam. Expect one tactical money move, tested in the field, in your
        inbox every Tuesday night.
      </p>
      <form className="mt-8 space-y-4" noValidate>
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email address
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-base"
          disabled
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <p className="text-sm text-slate-500">
          Newsletter sign-up is coming soon. We’ll wire this into Cloudflare Turnstile + Resend.
        </p>
        <button
          className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white opacity-60"
          disabled
          type="submit"
        >
          Launching soon
        </button>
      </form>
    </div>
  );
}
