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
}

export interface SendReportResult {
  success: boolean;
  deliveryId?: string;
  status: "Sent" | "Failed" | "Not Configured";
  message: string;
  error?: string;
}

export async function sendAccountabilityReport(
  params: SendReportParams
): Promise<SendReportResult> {
  // Check user settings and environment variables
  const settings = await prisma.userSettings.findFirst();

  const resendApiKey = process.env.RESEND_API_KEY || settings?.resendApiKey;
  const smtpHost = process.env.SMTP_HOST || settings?.smtpHost;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : settings?.smtpPort;
  const smtpUser = process.env.SMTP_USER || settings?.smtpUser;
  const smtpPass = process.env.SMTP_PASS || settings?.smtpPass;
  const smtpFrom = process.env.SMTP_FROM || settings?.smtpFrom || '"Interview Prep Tracker" <noreply@interviewtracker.dev>';

  const isConfigured = Boolean(resendApiKey || (smtpHost && smtpUser && smtpPass));

  if (!isConfigured) {
    // Record delivery attempt as unconfigured without false success
    const delivery = await prisma.reportDelivery.create({
      data: {
        recipientEmail: params.recipientEmail,
        reportType: params.reportType,
        reportDate: params.reportDate,
        dailyReportId: params.dailyReportId,
        weeklyReportId: params.weeklyReportId,
        monthlyReportId: params.monthlyReportId,
        status: "Failed",
        errorMessage: "No email provider configured. Set RESEND_API_KEY or SMTP credentials in Settings or .env to deliver real emails.",
        payloadJson: JSON.stringify({
          subject: params.subject,
          preview: params.markdownContent.slice(0, 300),
        }),
      },
    });

    return {
      success: false,
      deliveryId: delivery.id,
      status: "Not Configured",
      message:
        "Email delivery is not configured yet. You can preview or copy the report now, or configure your SMTP / Resend credentials in Settings.",
      error: "MISSING_PROVIDER_CREDENTIALS",
    };
  }

  try {
    if (resendApiKey) {
      // Use Resend HTTP API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: smtpFrom,
          to: [params.recipientEmail],
          subject: params.subject,
          html: params.htmlContent,
          text: params.markdownContent,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || `Resend error code ${response.status}`);
      }

      const delivery = await prisma.reportDelivery.create({
        data: {
          recipientEmail: params.recipientEmail,
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
      });

      return {
        success: true,
        deliveryId: delivery.id,
        status: "Sent",
        message: `Report successfully sent to ${params.recipientEmail} via Resend.`,
      };
    } else {
      // Use Nodemailer SMTP
      const transporter = nodemailer.createTransport({
        host: smtpHost || undefined,
        port: smtpPort || 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser || undefined,
          pass: smtpPass || undefined,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: params.recipientEmail,
        subject: params.subject,
        text: params.markdownContent,
        html: params.htmlContent,
      });

      const delivery = await prisma.reportDelivery.create({
        data: {
          recipientEmail: params.recipientEmail,
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
      });

      return {
        success: true,
        deliveryId: delivery.id,
        status: "Sent",
        message: `Report successfully sent to ${params.recipientEmail} via SMTP.`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    const delivery = await prisma.reportDelivery.create({
      data: {
        recipientEmail: params.recipientEmail,
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
    });

    return {
      success: false,
      deliveryId: delivery.id,
      status: "Failed",
      message: `Failed to deliver report to ${params.recipientEmail}: ${errorMsg}`,
      error: errorMsg,
    };
  }
}
