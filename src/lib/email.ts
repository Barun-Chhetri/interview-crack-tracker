import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export interface SendReportParams {
  recipientEmail: string;
  recipientName?: string;
  reportType: "Daily" | "Weekly" | "Monthly";
  reportDate: string;
  subject: string;
  markdownContent: string;
  htmlContent: string;
  dailyReportId?: string;
  weeklyReportId?: string;
  monthlyReportId?: string;
  testMode?: boolean;
}

export interface SendReportResult {
  success: boolean;
  deliveryId?: string;
  status: "Sent" | "Failed" | "Not Configured";
  message: string;
  previewUrl?: string;
  provider?: "resend" | "smtp" | "ethereal" | "preview";
  error?: string;
}

export async function getEmailDeliveryConfig() {
  let settings: {
    resendApiKey?: string | null;
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpPass?: string | null;
    smtpFrom?: string | null;
    defaultRecipientEmail?: string | null;
  } | null = null;

  try {
    settings = await prisma.userSettings.findFirst().catch(() => null);
  } catch {
    settings = null;
  }

  const resendApiKey = process.env.RESEND_API_KEY || settings?.resendApiKey || "";
  const smtpHost = process.env.SMTP_HOST || settings?.smtpHost || "";
  const smtpPort = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : settings?.smtpPort || 587;
  const smtpUser = process.env.SMTP_USER || settings?.smtpUser || "";
  const smtpPass = process.env.SMTP_PASS || settings?.smtpPass || "";
  const smtpFrom =
    process.env.SMTP_FROM ||
    settings?.smtpFrom ||
    "Interview Prep Tracker <noreply@interviewtracker.dev>";
  const defaultRecipientEmail = settings?.defaultRecipientEmail || "";

  const isResend = Boolean(resendApiKey && resendApiKey.trim().length > 0);
  const isSmtp = Boolean(
    smtpHost &&
      smtpHost.trim().length > 0 &&
      smtpUser &&
      smtpUser.trim().length > 0 &&
      smtpPass &&
      smtpPass.trim().length > 0
  );

  return {
    isConfigured: isResend || isSmtp,
    provider: isResend ? ("resend" as const) : isSmtp ? ("smtp" as const) : null,
    resendApiKey,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    defaultRecipientEmail,
  };
}

export async function sendAccountabilityReport(
  params: SendReportParams
): Promise<SendReportResult> {
  const config = await getEmailDeliveryConfig();

  // Parse recipient emails (supports single or comma-separated list)
  const recipients = params.recipientEmail
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  if (recipients.length === 0) {
    return {
      success: false,
      status: "Failed",
      message: "No valid recipient email address provided.",
      error: "MISSING_RECIPIENT",
    };
  }

  // Handle Seamless Ethereal Test Delivery when no live credentials are set yet or testMode is requested
  if (params.testMode || !config.isConfigured) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await testTransporter.sendMail({
        from: '"Interview Prep Tracker" <report@ethereal.email>',
        to: recipients.join(", "),
        subject: params.subject,
        text: params.markdownContent,
        html: params.htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

      let deliveryId: string | undefined;
      try {
        const delivery = await prisma.reportDelivery.create({
          data: {
            recipientEmail: recipients.join(", "),
            reportType: params.reportType,
            reportDate: params.reportDate,
            dailyReportId: params.dailyReportId,
            weeklyReportId: params.weeklyReportId,
            monthlyReportId: params.monthlyReportId,
            status: "Sent",
            sentAt: new Date(),
            payloadJson: JSON.stringify({
              provider: "ethereal",
              previewUrl,
              subject: params.subject,
            }),
          },
        }).catch(() => null);
        deliveryId = delivery?.id;
      } catch {
        // Non-blocking if DB is temporarily disconnected
      }

      return {
        success: true,
        deliveryId,
        status: "Sent",
        provider: "ethereal",
        previewUrl,
        message: `Report successfully dispatched! (Test Delivery Mode). Click 'Preview Email' below to view the rendered report in your browser. (To send directly to external Gmail/Outlook inboxes, configure your Resend or SMTP credentials in Settings).`,
      };
    } catch (testErr) {
      console.warn("Ethereal test mailer error, falling back to unconfigured response:", testErr);
    }
  }

  if (!config.isConfigured) {
    // Record delivery attempt as unconfigured without false success
    let deliveryId: string | undefined;
    try {
      const delivery = await prisma.reportDelivery.create({
        data: {
          recipientEmail: recipients.join(", "),
          reportType: params.reportType,
          reportDate: params.reportDate,
          dailyReportId: params.dailyReportId,
          weeklyReportId: params.weeklyReportId,
          monthlyReportId: params.monthlyReportId,
          status: "Failed",
          errorMessage:
            "No email provider configured. Set RESEND_API_KEY or SMTP credentials in Settings or .env to deliver real emails.",
          payloadJson: JSON.stringify({
            subject: params.subject,
            preview: params.markdownContent.slice(0, 300),
          }),
        },
      }).catch(() => null);
      deliveryId = delivery?.id;
    } catch {
      // Non-blocking
    }

    return {
      success: false,
      deliveryId,
      status: "Not Configured",
      message:
        "Email delivery is not configured yet. You can preview or copy the report now, or configure your SMTP / Resend credentials in Settings.",
      error: "MISSING_PROVIDER_CREDENTIALS",
    };
  }

  try {
    if (config.provider === "resend" && config.resendApiKey) {
      // For Resend: if no custom verified domain is specified, fallback to onboarding@resend.dev
      let resendFrom = config.smtpFrom;
      if (!resendFrom || resendFrom.includes("interviewtracker.dev")) {
        resendFrom = "Interview Prep Tracker <onboarding@resend.dev>";
      }

      // Use Resend HTTP API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: recipients,
          subject: params.subject,
          html: params.htmlContent,
          text: params.markdownContent,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || `Resend error code ${response.status}`);
      }

      let deliveryId: string | undefined;
      try {
        const delivery = await prisma.reportDelivery.create({
          data: {
            recipientEmail: recipients.join(", "),
            reportType: params.reportType,
            reportDate: params.reportDate,
            dailyReportId: params.dailyReportId,
            weeklyReportId: params.weeklyReportId,
            monthlyReportId: params.monthlyReportId,
            status: "Sent",
            sentAt: new Date(),
            payloadJson: JSON.stringify({
              provider: "resend",
              resendId: resData.id,
              subject: params.subject,
            }),
          },
        }).catch(() => null);
        deliveryId = delivery?.id;
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        deliveryId,
        status: "Sent",
        provider: "resend",
        message: `Report successfully sent to ${recipients.join(", ")} via Resend.`,
      };
    } else {
      // Use Nodemailer SMTP
      const transporter = nodemailer.createTransport({
        host: config.smtpHost || undefined,
        port: config.smtpPort || 587,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser || undefined,
          pass: config.smtpPass || undefined,
        },
      });

      let senderFrom = config.smtpFrom;
      if (!senderFrom || senderFrom.includes("noreply@interviewtracker.dev")) {
        senderFrom = `"Interview Prep Tracker" <${config.smtpUser}>`;
      }

      const info = await transporter.sendMail({
        from: senderFrom,
        to: recipients.join(", "),
        subject: params.subject,
        text: params.markdownContent,
        html: params.htmlContent,
      });

      let deliveryId: string | undefined;
      try {
        const delivery = await prisma.reportDelivery.create({
          data: {
            recipientEmail: recipients.join(", "),
            reportType: params.reportType,
            reportDate: params.reportDate,
            dailyReportId: params.dailyReportId,
            weeklyReportId: params.weeklyReportId,
            monthlyReportId: params.monthlyReportId,
            status: "Sent",
            sentAt: new Date(),
            payloadJson: JSON.stringify({
              provider: "smtp",
              messageId: info.messageId,
              subject: params.subject,
            }),
          },
        }).catch(() => null);
        deliveryId = delivery?.id;
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        deliveryId,
        status: "Sent",
        provider: "smtp",
        message: `Report successfully sent to ${recipients.join(", ")} via SMTP.`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    let deliveryId: string | undefined;
    try {
      const delivery = await prisma.reportDelivery.create({
        data: {
          recipientEmail: recipients.join(", "),
          reportType: params.reportType,
          reportDate: params.reportDate,
          dailyReportId: params.dailyReportId,
          weeklyReportId: params.weeklyReportId,
          monthlyReportId: params.monthlyReportId,
          status: "Failed",
          errorMessage: errorMsg,
          payloadJson: JSON.stringify({
            subject: params.subject,
          }),
        },
      }).catch(() => null);
      deliveryId = delivery?.id;
    } catch {
      // Non-blocking
    }

    return {
      success: false,
      deliveryId,
      status: "Failed",
      message: `Failed to deliver report to ${recipients.join(", ")}: ${errorMsg}`,
      error: errorMsg,
    };
  }
}
