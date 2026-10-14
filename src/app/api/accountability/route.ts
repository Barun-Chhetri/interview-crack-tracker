import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recipients = await prisma.reportRecipient.findMany({
      orderBy: { createdAt: "desc" },
    });

    const settings = await prisma.userSettings.findFirst();

    const deliveries = await prisma.reportDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const isEmailConfigured = Boolean(
      process.env.RESEND_API_KEY ||
        settings?.resendApiKey ||
        (process.env.SMTP_HOST && process.env.SMTP_USER) ||
        (settings?.smtpHost && settings?.smtpUser)
    );

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
          }
        : null,
      deliveries,
      isEmailConfigured,
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

      const user = await prisma.user.findFirst();
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
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
