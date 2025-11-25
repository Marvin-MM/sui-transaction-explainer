import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendOnboardingEmail(email: string, displayName?: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: "Welcome to Sui Transaction Explainer",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Welcome to Sui Transaction Explainer!</h1>
          <p>Hi ${displayName || "there"},</p>
          <p>Thank you for joining us. Your account is now ready to use.</p>
          <p>You can now:</p>
          <ul>
            <li>Paste any Sui transaction digest to get a human-readable explanation</li>
            <li>Connect your wallet to save your transaction history</li>
            <li>Set up webhooks for real-time monitoring</li>
            <li>Export your transactions as CSV or PDF</li>
          </ul>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
               style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
              Get Started
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Questions? Reply to this email or visit our documentation.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send onboarding email:", error)
    throw error
  }
}
