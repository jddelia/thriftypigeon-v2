export const metadata = {
  title: "Confirm subscription",
  description: "Check your inbox to complete your subscription.",
};

export default function SubscribeConfirmPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Check your inbox</h1>
      <p className="mt-3 text-slate-600">
        We just sent you a confirmation email. Click the link inside to start receiving weekly money
        playbooks and systems.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Didn’t get it? Peek at your spam folder and add <strong>hello@thethriftypigeon.com</strong>
        to your contacts.
      </p>
    </div>
  );
}
