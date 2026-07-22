import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.MAIL_FROM!;
const APP_URL = process.env.NEXTAUTH_URL;

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  console.log("URL: ", url)
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #1a1e20; color: #e1e3e4; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 10px 0;">Verify your email address</h2>
          <p style="color: #a3a7a9; font-size: 15px; margin: 0;">Welcome to Kinora. Click the button below to verify your account.</p>
        </div>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${url}" style="background-color: oklch(0.78 0.19 130); background-color: #c4f036; color: #121617; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(196, 240, 54, 0.2);">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #a3a7a9; text-align: center; line-height: 1.5; margin: 30px 0;">
          This link will expire in <strong>10 minutes</strong>.<br />
          If the button doesn't work, copy and paste the link below into your browser:
        </p>
        <p style="font-size: 13px; word-break: break-all; text-align: center; background-color: #24292c; padding: 12px; border-radius: 8px; margin: 0 0 30px 0;">
          <a href="${url}" style="color: #ff7e5f; text-decoration: none; font-weight: 500;">${url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #2d3337; margin: 30px 0;" />
        <p style="font-size: 12px; color: #767b7e; text-align: center; margin: 0;">
          If you did not create a Kinora account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  console.log("Sending email")
  const url = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #1a1e20; color: #e1e3e4; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 10px 0;">Reset your password</h2>
          <p style="color: #a3a7a9; font-size: 15px; margin: 0;">You requested to reset your password. Click the button below to choose a new one.</p>
        </div>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${url}" style="background-color: oklch(0.78 0.19 130); background-color: #c4f036; color: #121617; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(196, 240, 54, 0.2);">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #a3a7a9; text-align: center; line-height: 1.5; margin: 30px 0;">
          This reset link will expire in <strong>10 minutes</strong>.<br />
          If the button doesn't work, copy and paste the link below into your browser:
        </p>
        <p style="font-size: 13px; word-break: break-all; text-align: center; background-color: #24292c; padding: 12px; border-radius: 8px; margin: 0 0 30px 0;">
          <a href="${url}" style="color: #ff7e5f; text-decoration: none; font-weight: 500;">${url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #2d3337; margin: 30px 0;" />
        <p style="font-size: 12px; color: #767b7e; text-align: center; margin: 0;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
  if (result.error) {
    console.log("Error sending email: ", result.error.message)
  } else {
    console.log("Sent email: ", result.data)
  }
  return result
}
