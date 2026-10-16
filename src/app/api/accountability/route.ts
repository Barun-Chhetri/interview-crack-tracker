import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailDeliveryConfig, sendAccountabilityReport } from "@/lib/email";

export async function GET() {
  try {
    const recipients = await prisma.reportRecipient.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const settings = await prisma.userSettings.findFirst().catch(() => null);

    const deliveries = await prisma.reportDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }).catch(() => []);

    const emailConfig = await getEmailDeliveryConfig();

    return NextResponse.json({
      recipients,
      settings: settings
        ? {
            autoReportDelivery: settings.autoReportDelivery,
            autoReportFrequency: settings.autoReportFrequency,
            defaultRecipientEmail: settings.defaultRecipientEmail,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUser: settings.smtpUser ? `${settings.smtpUser.slice(0, 3)}***` : null, // Mask credentials
            smtpFrom: settings.smtpFrom,
            hasResendKey: Boolean(settings.resendApiKey || process.env.RESEND_API_KEY),
            hasSmtpPass: Boolean(settings.smtpPass || process.env.SMTP_PASS),
          }
        : null,
      deliveries,
      isEmailConfigured: emailConfig.isConfigured,
      provider: emailConfig.provider,
      defaultRecipientEmail: emailConfig.defaultRecipientEmail,
      configuredFrom: emailConfig.smtpFrom,
    });
  } catch (error) {
    console.error("GET /api/accountability error:", error);
    return NextResponse.json({ error: "Failed to fetch accountability settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "addRecipient") {
      const { name, email, relationship, receiveDaily, receiveWeekly, receiveMonthly } = body;
      if (!name || !email) {
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      const recipient = await prisma.reportRecipient.create({
        data: {
          name,
          email,
          relationship: relationship || "Accountability Partner",
          receiveDaily: receiveDaily ?? true,
          receiveWeekly: receiveWeekly ?? true,
          receiveMonthly: receiveMonthly ?? true,
          isEnabled: true,
        },
      });

      return NextResponse.json({ success: true, recipient });
    }

    if (action === "updateSettings") {
      const {
        autoReportDelivery,
        autoReportFrequency,
        defaultRecipientEmail,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpFrom,
        resendApiKey,
      } = body;

      let user = await prisma.user.findFirst().catch(() => null);
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "Barun Chhetri",
            email: "barun.chhetri444@gmail.com",
            university: "University of North Texas (UNT)",
            targetRole: "Summer 2027 Software Engineering Intern",
          },
        }).catch(() => null);
      }

      if (!user) {
        return NextResponse.json({ error: "Database unavailable to save settings" }, { status: 503 });
      }

      const updated = await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          ...(autoReportDelivery !== undefined ? { autoReportDelivery } : {}),
          ...(autoReportFrequency !== undefined ? { autoReportFrequency } : {}),
          ...(defaultRecipientEmail !== undefined ? { defaultRecipientEmail } : {}),
          ...(smtpHost !== undefined ? { smtpHost } : {}),
          ...(smtpPort !== undefined ? { smtpPort: Number(smtpPort) } : {}),
          ...(smtpUser !== undefined ? { smtpUser } : {}),
          ...(smtpPass !== undefined && smtpPass !== "" ? { smtpPass } : {}),
          ...(smtpFrom !== undefined ? { smtpFrom } : {}),
          ...(resendApiKey !== undefined && resendApiKey !== "" ? { resendApiKey } : {}),
        },
        create: {
          userId: user.id,
          autoReportDelivery: autoReportDelivery ?? false,
          autoReportFrequency: autoReportFrequency ?? "daily",
          defaultRecipientEmail,
          smtpHost,
          smtpPort: smtpPort ? Number(smtpPort) : undefined,
          smtpUser,
          smtpPass,
          smtpFrom,
          resendApiKey,
        },
      });

      return NextResponse.json({ success: true, settings: updated });
    }

    if (action === "testEmail") {
      const { recipientEmail, testMode } = body;
      const result = await sendAccountabilityReport({
        recipientEmail: recipientEmail || "test@example.com",
        reportType: "Daily",
        reportDate: new Date().toISOString().slice(0, 10),
        subject: "[180-Day Tracker] Test Accountability Email Verification",
        markdownContent: "# Test Email Delivery\nYour email delivery provider is configured and functioning correctly!",
        htmlContent: `<div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto;"><h2 style="color: #059669; margin-top: 0;">✓ Email Delivery Verified</h2><p>Your email provider (Resend/SMTP) is successfully connected to the 180-Day Interview Preparation Tracker.</p><p style="color: #64748b; font-size: 12px;">Sent on ${new Date().toLocaleString()}</p></div>`,
        testMode: Boolean(testMode),
      });

      return NextResponse.json(result);
    }

    if (action === "deleteRecipient") {
      const { recipientId } = body;
      await prisma.reportRecipient.delete({
        where: { id: recipientId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/accountability error:", error);
    return NextResponse.json({ error: "Failed to update accountability" }, { status: 500 });
  }
}
