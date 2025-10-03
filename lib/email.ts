import { z } from "zod";

const resendEnv = z.object({
  RESEND_API_KEY: z.string().min(1, "Set RESEND_API_KEY"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email"),
});

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const env = resendEnv.safeParse(process.env);

  if (!env.success) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid Resend configuration: ${env.error.message}`);
    }
    console.warn("Email service is not configured. Skipping send.");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("Simulating email send", input);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.data.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.data.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${error}`);
  }
}
