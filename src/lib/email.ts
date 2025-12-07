import nodemailer from "nodemailer";
import { db } from "./db";
import crypto from "crypto";

const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const isSecurePort = smtpPort === 465;
const useSecure = process.env.SMTP_SECURE === "true" || isSecurePort;
const isDevelopment = process.env.NODE_ENV === "development";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: useSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  debug: false,
  logger: false,
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
});

const templates = {
  verification: (name: string, verificationUrl: string) => ({
    subject: "Verify your email - Lana Career Platform",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #162660; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Lana</h1>
                      <p style="margin: 8px 0 0 0; color: #D0E6FD; font-size: 14px;">AI-Powered Career Guidance</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #162660; font-size: 24px;">Welcome, ${name}!</h2>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                        Thank you for joining Lana! To get started on your career journey, please verify your email address by clicking the button below.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${verificationUrl}" 
                               style="display: inline-block; padding: 16px 32px; background-color: #162660; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't create an account with Lana, you can safely ignore this email.
                      </p>
                      <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">
                        This link will expire in 24 hours.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #F1E4D1; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #162660; font-size: 12px;">
                        © ${new Date().getFullYear()} Lana Career Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Welcome to Lana, ${name}!\n\nThank you for joining Lana Career Platform. To get started on your career journey, please verify your email address by visiting the following link:\n\n${verificationUrl}\n\nIf you didn't create an account with Lana, you can safely ignore this email.\n\nThis link will expire in 24 hours.\n\n© ${new Date().getFullYear()} Lana Career Platform. All rights reserved.`,
  }),

  courseAvailable: (name: string, courseTitle: string, courseUrl: string) => ({
    subject: `Great News! "${courseTitle}" is Now Available - Lana`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Course Available</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #162660; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Lana</h1>
                      <p style="margin: 8px 0 0 0; color: #D0E6FD; font-size: 14px;">AI-Powered Career Guidance</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #162660; font-size: 24px;">Great News, ${name}!</h2>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                        The course you've been waiting for is now available! <strong>"${courseTitle}"</strong> is ready for you to start learning.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${courseUrl}" 
                               style="display: inline-block; padding: 16px 32px; background-color: #162660; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                              Start Learning Now
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        We're excited to have you on this learning journey. If you have any questions, feel free to reach out to our support team.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #F1E4D1; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #162660; font-size: 12px;">
                        © ${new Date().getFullYear()} Lana Career Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Great News, ${name}!\n\nThe course you've been waiting for is now available! "${courseTitle}" is ready for you to start learning.\n\nVisit the course: ${courseUrl}\n\nWe're excited to have you on this learning journey. If you have any questions, feel free to reach out to our support team.\n\n© ${new Date().getFullYear()} Lana Career Platform. All rights reserved.`,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: "Reset your password - Lana Career Platform",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #162660; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Lana</h1>
                      <p style="margin: 8px 0 0 0; color: #D0E6FD; font-size: 14px;">AI-Powered Career Guidance</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #162660; font-size: 24px;">Reset Your Password</h2>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                        Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; padding: 16px 32px; background-color: #162660; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                      <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">
                        This link will expire in 1 hour.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #F1E4D1; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #162660; font-size: 12px;">
                        © ${new Date().getFullYear()} Lana Career Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Reset Your Password\n\nHi ${name}, we received a request to reset your password. Visit the following link to create a new password:\n\n${resetUrl}\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nThis link will expire in 1 hour.\n\n© ${new Date().getFullYear()} Lana Career Platform. All rights reserved.`,
  }),

  adminInvitation: (name: string, invitationUrl: string, inviterName: string) => ({
    subject: "You've been invited to be an Admin - Lana Career Platform",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #162660; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Lana</h1>
                      <p style="margin: 8px 0 0 0; color: #D0E6FD; font-size: 14px;">AI-Powered Career Guidance</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #162660; font-size: 24px;">Admin Invitation</h2>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                        Hi ${name}, you've been invited by <strong>${inviterName}</strong> to become an administrator of the Lana Career Platform.
                      </p>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                        As an admin, you'll have access to manage courses, users, certificates, and other platform features.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${invitationUrl}" 
                               style="display: inline-block; padding: 16px 32px; background-color: #162660; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                              Accept Invitation & Set Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't expect this invitation, you can safely ignore this email.
                      </p>
                      <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">
                        This invitation link will expire in 7 days.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #F1E4D1; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #162660; font-size: 12px;">
                        © ${new Date().getFullYear()} Lana Career Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Admin Invitation\n\nHi ${name}, you've been invited by ${inviterName} to become an administrator of the Lana Career Platform.\n\nAs an admin, you'll have access to manage courses, users, certificates, and other platform features.\n\nAccept your invitation: ${invitationUrl}\n\nIf you didn't expect this invitation, you can safely ignore this email.\n\nThis invitation link will expire in 7 days.\n\n© ${new Date().getFullYear()} Lana Career Platform. All rights reserved.`,
  }),
};


export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  const storedToken = await db.verificationToken.findFirst({
    where: {
      token,
      expires: { gt: new Date() },
    },
  });

  if (!storedToken) {
    return null;
  }

  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: storedToken.identifier,
        token: storedToken.token,
      },
    },
  });

  return { email: storedToken.identifier };
}

export async function verifySMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error: unknown) {
    const errorObj = error instanceof Error 
      ? { code: (error as { code?: string }).code, message: error.message }
      : { code: undefined, message: String(error) };
    
    if (isDevelopment) {
      console.error("SMTP connection verification failed:", {
        code: errorObj.code,
        message: errorObj.message,
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
      });
    } else {
      console.error("SMTP connection verification failed:", {
        code: errorObj.code,
        message: errorObj.message,
      });
    }
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const template = templates.verification(name, verificationUrl);
  const emailFrom = process.env.EMAIL_FROM || "Lana <noreply@lana.com>";

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error 
      ? { code: (error as { code?: string }).code, message: error.message }
      : { code: undefined, message: String(error) };

    if (isDevelopment) {
      console.error("Failed to send verification email:", {
        code: errorObj.code,
        message: errorObj.message,
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
      });

      if (errorObj.code === "ETIMEDOUT" || errorObj.code === "ECONNREFUSED") {
        throw new Error(
          `SMTP connection failed. Check your SMTP settings:\n` +
            `- Host: ${process.env.SMTP_HOST}\n` +
            `- Port: ${smtpPort}\n` +
            `- Secure: ${useSecure}\n` +
            `- Error: ${errorObj.message}`
        );
      }
      if (errorObj.code === "EAUTH") {
        throw new Error("SMTP authentication failed. Check your SMTP credentials.");
      }
      throw error;
    } else {
      console.error("Failed to send verification email:", {
        code: errorObj.code,
        message: errorObj.message,
      });
      throw new Error("Failed to send verification email. Please try again later.");
    }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const template = templates.passwordReset(name, resetUrl);
  const emailFrom = process.env.EMAIL_FROM || "Lana <noreply@lana.com>";

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error 
      ? { code: (error as { code?: string }).code, message: error.message }
      : { code: undefined, message: String(error) };

    if (isDevelopment) {
      console.error("Failed to send password reset email:", {
        code: errorObj.code,
        message: errorObj.message,
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
      });

      if (errorObj.code === "ETIMEDOUT" || errorObj.code === "ECONNREFUSED") {
        throw new Error(`SMTP connection failed. Error: ${errorObj.message}`);
      }
      throw error;
    } else {
      console.error("Failed to send password reset email:", {
        code: errorObj.code,
        message: errorObj.message,
      });
      throw new Error("Failed to send password reset email. Please try again later.");
    }
  }
}

export async function sendCourseAvailableEmail(
  email: string,
  name: string,
  courseTitle: string,
  courseSlug: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const courseUrl = `${baseUrl}/courses/${courseSlug}`;
  const template = templates.courseAvailable(name, courseTitle, courseUrl);
  const emailFrom = process.env.EMAIL_FROM || "Lana <noreply@lana.com>";
  
  try {
    await transporter.sendMail({
      from: emailFrom, 
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error 
      ? { code: (error as { code?: string }).code, message: error.message }
      : { code: undefined, message: String(error) };

    if (isDevelopment) {
      console.error("Failed to send course available email:", {
        code: errorObj.code,
        message: errorObj.message,
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
      });

      if (errorObj.code === "ETIMEDOUT" || errorObj.code === "ECONNREFUSED") {
        throw new Error(`SMTP connection failed. Error: ${errorObj.message}`);
      }
      throw error;
    } else {
      console.error("Failed to send course available email:", {
        code: errorObj.code,
        message: errorObj.message,
      });
      throw new Error("Failed to send notification email. Please try again later.");
    }
  }
}

export async function sendAdminInvitationEmail(
  email: string,
  name: string,
  token: string,
  inviterName: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const invitationUrl = `${baseUrl}/admin/accept-invitation?token=${token}`;
  const template = templates.adminInvitation(name, invitationUrl, inviterName);
  const emailFrom = process.env.EMAIL_FROM || "Lana <noreply@lana.com>";

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error 
      ? { code: (error as { code?: string }).code, message: error.message }
      : { code: undefined, message: String(error) };

    if (isDevelopment) {
      console.error("Failed to send admin invitation email:", {
        code: errorObj.code,
        message: errorObj.message,
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
      });

      if (errorObj.code === "ETIMEDOUT" || errorObj.code === "ECONNREFUSED") {
        throw new Error(`SMTP connection failed. Error: ${errorObj.message}`);
      }
      throw error;
    } else {
      console.error("Failed to send admin invitation email:", {
        code: errorObj.code,
        message: errorObj.message,
      });
      throw new Error("Failed to send admin invitation email. Please try again later.");
    }
  }
}

export default transporter;
