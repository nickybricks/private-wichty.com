// Email Branding Constants for wichty
// All emails must use these constants for consistent branding

export const EMAIL_BRANDING = {
  colors: {
    background: "#f5f5f5",
    card: "#ffffff",
    buttonBg: "#1a1a1a",
    buttonText: "#ffffff",
    textPrimary: "#1a1a1a",
    textSecondary: "#333",
    textMuted: "#666",
    textLight: "#999",
    border: "#eee",
    badgeBg: "#f0f0f0",
    successBg: "#dcfce7",
    successText: "#166534",
    warningBg: "#fef3c7",
    warningText: "#92400e",
    errorBg: "#fee2e2",
    errorText: "#991b1b",
    accent: "#f87171", // wichty pink/coral accent
  },
  styles: {
    cardBorderRadius: "16px",
    buttonBorderRadius: "12px",
    badgeBorderRadius: "20px",
    maxWidth: "480px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  assets: {
    logoUrl: "https://wichty.com/email-logo.png",
    logoSize: "115px",
  },
  sender: {
    tickets: "Wichty <tickets@wichty.com>",
    noreply: "Wichty <noreply@wichty.com>",
    events: "Wichty <events@wichty.com>",
  },
  footer: {
    de: "Gesendet mit ❤️ von wichty.com",
    en: "Sent with ❤️ by wichty.com",
  },
};

// All notification types supported by the system
export type NotificationType =
  // Guest notifications
  | "ticket_purchased"
  | "ticket_rsvp"
  | "join_request_sent"
  | "join_request_approved"
  | "join_request_rejected"
  | "ticket_cancelled"
  | "ticket_cancelled_by_host"
  | "event_reminder_guest"
  | "ticket_checked_in"
  // Host notifications
  | "new_rsvp"
  | "new_purchase"
  | "new_join_request"
  | "participant_cancelled"
  | "event_created"
  | "event_reminder_host"
  | "event_ended"
  | "event_deleted"
  // Account notifications
  | "account_deleted";

export interface EmailContent {
  badge: string;
  title: string;
  subtitle?: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  footerText?: string;
  language?: "de" | "en";
  showLogo?: boolean;
  heroImageUrl?: string;
  guideSteps?: { icon: string; title: string; description: string }[];
}

export interface NotificationEmailContent {
  type: NotificationType;
  language: "de" | "en";
  recipientEmail: string;
  recipientName: string;
  eventName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  eventUrl?: string;
  ticketUrl?: string;
  participantName?: string;
  participantCount?: number;
  checkedInCount?: number;
  ticketCount?: number;
  revenue?: string;
  customMessage?: string;
}

// Get notification content based on type
export function getNotificationContent(content: NotificationEmailContent): {
  subject: string;
  badge: string;
  title: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  footerText?: string;
} {
  const isGerman = content.language === "de";
  const baseUrl = "https://wichty.com";

  const templates: Record<NotificationType, {
    subject: { de: string; en: string };
    badge: { de: string; en: string };
    title: { de: string; en: string };
    message: { de: string; en: string };
    buttonText: { de: string; en: string };
    getButtonUrl: () => string;
    footerText?: { de: string; en: string };
  }> = {
    // === GUEST NOTIFICATIONS ===
    ticket_purchased: {
      subject: {
        de: `Dein Ticket für ${content.eventName}`,
        en: `Your ticket for ${content.eventName}`,
      },
      badge: { de: "TICKET GEKAUFT", en: "TICKET PURCHASED" },
      title: {
        de: `Du bist dabei! 🎉`,
        en: `You're in! 🎉`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Ticket für "${content.eventName}" wurde erfolgreich gekauft. Wir freuen uns auf dich!`,
        en: `Hey ${content.recipientName}, your ticket for "${content.eventName}" has been successfully purchased. We look forward to seeing you!`,
      },
      buttonText: { de: "Ticket ansehen", en: "View Ticket" },
      getButtonUrl: () => content.ticketUrl || baseUrl,
      footerText: {
        de: "Zeige dieses Ticket am Eingang vor.",
        en: "Show this ticket at the entrance.",
      },
    },
    ticket_rsvp: {
      subject: {
        de: `Zusage bestätigt: ${content.eventName}`,
        en: `RSVP confirmed: ${content.eventName}`,
      },
      badge: { de: "ZUSAGE", en: "RSVP" },
      title: {
        de: `Du bist dabei! 🎉`,
        en: `You're in! 🎉`,
      },
      message: {
        de: `Hey ${content.recipientName}, deine Teilnahme an "${content.eventName}" ist bestätigt. Wir freuen uns auf dich!`,
        en: `Hey ${content.recipientName}, your attendance at "${content.eventName}" is confirmed. We look forward to seeing you!`,
      },
      buttonText: { de: "Ticket ansehen", en: "View Ticket" },
      getButtonUrl: () => content.ticketUrl || baseUrl,
      footerText: {
        de: "Zeige dieses Ticket am Eingang vor.",
        en: "Show this ticket at the entrance.",
      },
    },
    join_request_sent: {
      subject: {
        de: `Beitrittsanfrage gesendet: ${content.eventName}`,
        en: `Join request sent: ${content.eventName}`,
      },
      badge: { de: "ANFRAGE GESENDET", en: "REQUEST SENT" },
      title: {
        de: `Anfrage eingereicht 📩`,
        en: `Request submitted 📩`,
      },
      message: {
        de: `Hey ${content.recipientName}, deine Beitrittsanfrage für "${content.eventName}" wurde gesendet. Du erhältst eine Benachrichtigung, sobald der Host entscheidet.`,
        en: `Hey ${content.recipientName}, your join request for "${content.eventName}" has been sent. You'll be notified once the host decides.`,
      },
      buttonText: { de: "Event ansehen", en: "View Event" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    join_request_approved: {
      subject: {
        de: `Beitrittsanfrage genehmigt: ${content.eventName}`,
        en: `Join request approved: ${content.eventName}`,
      },
      badge: { de: "GENEHMIGT", en: "APPROVED" },
      title: {
        de: `Du bist dabei! 🎉`,
        en: `You're in! 🎉`,
      },
      message: {
        de: `Hey ${content.recipientName}, deine Beitrittsanfrage für "${content.eventName}" wurde genehmigt. Hier ist dein Ticket!`,
        en: `Hey ${content.recipientName}, your join request for "${content.eventName}" has been approved. Here's your ticket!`,
      },
      buttonText: { de: "Ticket ansehen", en: "View Ticket" },
      getButtonUrl: () => content.ticketUrl || baseUrl,
      footerText: {
        de: "Zeige dieses Ticket am Eingang vor.",
        en: "Show this ticket at the entrance.",
      },
    },
    join_request_rejected: {
      subject: {
        de: `Beitrittsanfrage abgelehnt: ${content.eventName}`,
        en: `Join request declined: ${content.eventName}`,
      },
      badge: { de: "ABGELEHNT", en: "DECLINED" },
      title: {
        de: `Anfrage abgelehnt 😔`,
        en: `Request declined 😔`,
      },
      message: {
        de: `Hey ${content.recipientName}, leider wurde deine Beitrittsanfrage für "${content.eventName}" abgelehnt.`,
        en: `Hey ${content.recipientName}, unfortunately your join request for "${content.eventName}" has been declined.`,
      },
      buttonText: { de: "Andere Events entdecken", en: "Discover other events" },
      getButtonUrl: () => baseUrl,
    },
    ticket_cancelled: {
      subject: {
        de: `Teilnahme storniert: ${content.eventName}`,
        en: `Participation cancelled: ${content.eventName}`,
      },
      badge: { de: "STORNIERT", en: "CANCELLED" },
      title: {
        de: `Stornierung bestätigt`,
        en: `Cancellation confirmed`,
      },
      message: {
        de: `Hey ${content.recipientName}, deine Teilnahme an "${content.eventName}" wurde storniert. Wir hoffen, dich bei einem anderen Event zu sehen!`,
        en: `Hey ${content.recipientName}, your participation in "${content.eventName}" has been cancelled. We hope to see you at another event!`,
      },
      buttonText: { de: "Andere Events entdecken", en: "Discover other events" },
      getButtonUrl: () => baseUrl,
    },
    ticket_cancelled_by_host: {
      subject: {
        de: `Teilnahme vom Host storniert: ${content.eventName}`,
        en: `Participation cancelled by host: ${content.eventName}`,
      },
      badge: { de: "VOM HOST STORNIERT", en: "CANCELLED BY HOST" },
      title: {
        de: `Stornierung durch den Host`,
        en: `Cancelled by host`,
      },
      message: {
        de: `Hey ${content.recipientName}, leider wurde deine Teilnahme an "${content.eventName}" vom Host storniert.${content.customMessage ? ` Grund: ${content.customMessage}` : ""}`,
        en: `Hey ${content.recipientName}, unfortunately your participation in "${content.eventName}" has been cancelled by the host.${content.customMessage ? ` Reason: ${content.customMessage}` : ""}`,
      },
      buttonText: { de: "Andere Events entdecken", en: "Discover other events" },
      getButtonUrl: () => baseUrl,
    },
    event_reminder_guest: {
      subject: {
        de: `Erinnerung: ${content.eventName} startet bald!`,
        en: `Reminder: ${content.eventName} starts soon!`,
      },
      badge: { de: "ERINNERUNG", en: "REMINDER" },
      title: {
        de: `Bist du bereit? ⏰`,
        en: `Are you ready? ⏰`,
      },
      message: {
        de: `Hey ${content.recipientName}, "${content.eventName}" startet in weniger als 12 Stunden! Vergiss nicht, dein Ticket bereitzuhalten.`,
        en: `Hey ${content.recipientName}, "${content.eventName}" starts in less than 12 hours! Don't forget to have your ticket ready.`,
      },
      buttonText: { de: "Ticket ansehen", en: "View Ticket" },
      getButtonUrl: () => content.ticketUrl || baseUrl,
    },
    ticket_checked_in: {
      subject: {
        de: `Check-in bestätigt: ${content.eventName}`,
        en: `Check-in confirmed: ${content.eventName}`,
      },
      badge: { de: "EINGECHECKT", en: "CHECKED IN" },
      title: {
        de: `Willkommen! ✅`,
        en: `Welcome! ✅`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Check-in bei "${content.eventName}" war erfolgreich. Viel Spaß!`,
        en: `Hey ${content.recipientName}, your check-in at "${content.eventName}" was successful. Enjoy!`,
      },
      buttonText: { de: "Event Details", en: "Event Details" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },

    // === HOST NOTIFICATIONS ===
    new_rsvp: {
      subject: {
        de: `Neue Zusage: ${content.participantName} für ${content.eventName}`,
        en: `New RSVP: ${content.participantName} for ${content.eventName}`,
      },
      badge: { de: "NEUE ZUSAGE", en: "NEW RSVP" },
      title: {
        de: `${content.participantName} ist dabei! 🎉`,
        en: `${content.participantName} is in! 🎉`,
      },
      message: {
        de: `Hey ${content.recipientName}, gute Nachrichten! ${content.participantName} hat für "${content.eventName}" zugesagt.`,
        en: `Hey ${content.recipientName}, good news! ${content.participantName} has RSVP'd for "${content.eventName}".`,
      },
      buttonText: { de: "Teilnehmer ansehen", en: "View Participants" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    new_purchase: {
      subject: {
        de: `Neuer Ticketkauf: ${content.participantName} für ${content.eventName}`,
        en: `New ticket purchase: ${content.participantName} for ${content.eventName}`,
      },
      badge: { de: "NEUER KAUF", en: "NEW PURCHASE" },
      title: {
        de: `Kauf bestätigt! 💰`,
        en: `Purchase confirmed! 💰`,
      },
      message: {
        de: `Hey ${content.recipientName}, ${content.participantName} hat ein Ticket für "${content.eventName}" gekauft.`,
        en: `Hey ${content.recipientName}, ${content.participantName} has purchased a ticket for "${content.eventName}".`,
      },
      buttonText: { de: "Event verwalten", en: "Manage Event" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    new_join_request: {
      subject: {
        de: `Neue Beitrittsanfrage: ${content.participantName} für ${content.eventName}`,
        en: `New join request: ${content.participantName} for ${content.eventName}`,
      },
      badge: { de: "NEUE ANFRAGE", en: "NEW REQUEST" },
      title: {
        de: `Anfrage erhalten 📩`,
        en: `Request received 📩`,
      },
      message: {
        de: `Hey ${content.recipientName}, ${content.participantName} möchte an "${content.eventName}" teilnehmen. Bitte prüfe die Anfrage.`,
        en: `Hey ${content.recipientName}, ${content.participantName} wants to join "${content.eventName}". Please review the request.`,
      },
      buttonText: { de: "Anfrage prüfen", en: "Review Request" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    participant_cancelled: {
      subject: {
        de: `Stornierung: ${content.participantName} für ${content.eventName}`,
        en: `Cancellation: ${content.participantName} for ${content.eventName}`,
      },
      badge: { de: "STORNIERUNG", en: "CANCELLATION" },
      title: {
        de: `Teilnehmer hat storniert`,
        en: `Participant cancelled`,
      },
      message: {
        de: `Hey ${content.recipientName}, ${content.participantName} hat die Teilnahme an "${content.eventName}" storniert.`,
        en: `Hey ${content.recipientName}, ${content.participantName} has cancelled their participation in "${content.eventName}".`,
      },
      buttonText: { de: "Teilnehmer ansehen", en: "View Participants" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    event_created: {
      subject: {
        de: `Event erstellt: ${content.eventName}`,
        en: `Event created: ${content.eventName}`,
      },
      badge: { de: "EVENT ERSTELLT", en: "EVENT CREATED" },
      title: {
        de: `Dein Event ist live! 🚀`,
        en: `Your event is live! 🚀`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Event "${content.eventName}" wurde erfolgreich erstellt. Teile den Link, um Teilnehmer einzuladen!`,
        en: `Hey ${content.recipientName}, your event "${content.eventName}" has been created successfully. Share the link to invite participants!`,
      },
      buttonText: { de: "Event ansehen", en: "View Event" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    event_reminder_host: {
      subject: {
        de: `Dein Event ${content.eventName} startet bald!`,
        en: `Your event ${content.eventName} starts soon!`,
      },
      badge: { de: "ERINNERUNG", en: "REMINDER" },
      title: {
        de: `Bereit für dein Event? ⏰`,
        en: `Ready for your event? ⏰`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Event "${content.eventName}" startet in weniger als 12 Stunden! Du hast ${content.participantCount || 0} Teilnehmer. Ab jetzt kannst du Tickets scannen.`,
        en: `Hey ${content.recipientName}, your event "${content.eventName}" starts in less than 12 hours! You have ${content.participantCount || 0} participants. You can now start scanning tickets.`,
      },
      buttonText: { de: "Tickets scannen", en: "Scan Tickets" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    event_ended: {
      subject: {
        de: `Event Zusammenfassung: ${content.eventName}`,
        en: `Event Summary: ${content.eventName}`,
      },
      badge: { de: "EVENT BEENDET", en: "EVENT ENDED" },
      title: {
        de: `Das war's! 🎊`,
        en: `That's a wrap! 🎊`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Event "${content.eventName}" ist vorbei.\n\n📊 Statistik:\n• Teilnehmer: ${content.participantCount || 0}\n• Eingecheckt: ${content.checkedInCount || 0} (${content.participantCount ? Math.round(((content.checkedInCount || 0) / content.participantCount) * 100) : 0}%)`,
        en: `Hey ${content.recipientName}, your event "${content.eventName}" has ended.\n\n📊 Stats:\n• Participants: ${content.participantCount || 0}\n• Checked in: ${content.checkedInCount || 0} (${content.participantCount ? Math.round(((content.checkedInCount || 0) / content.participantCount) * 100) : 0}%)`,
      },
      buttonText: { de: "Event ansehen", en: "View Event" },
      getButtonUrl: () => content.eventUrl || baseUrl,
    },
    event_deleted: {
      subject: {
        de: `Event gelöscht: ${content.eventName}`,
        en: `Event deleted: ${content.eventName}`,
      },
      badge: { de: "EVENT GELÖSCHT", en: "EVENT DELETED" },
      title: {
        de: `Event wurde gelöscht`,
        en: `Event has been deleted`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein Event "${content.eventName}" wurde erfolgreich gelöscht.`,
        en: `Hey ${content.recipientName}, your event "${content.eventName}" has been successfully deleted.`,
      },
      buttonText: { de: "Neues Event erstellen", en: "Create New Event" },
      getButtonUrl: () => `${baseUrl}/dashboard`,
    },

    // === ACCOUNT NOTIFICATIONS ===
    account_deleted: {
      subject: {
        de: "Dein Konto wurde gelöscht",
        en: "Your account has been deleted",
      },
      badge: { de: "KONTO GELÖSCHT", en: "ACCOUNT DELETED" },
      title: {
        de: `Auf Wiedersehen 👋`,
        en: `Goodbye 👋`,
      },
      message: {
        de: `Hey ${content.recipientName}, dein wichty-Konto wurde erfolgreich gelöscht. Alle deine Daten wurden entfernt. Wir hoffen, dich bald wiederzusehen!`,
        en: `Hey ${content.recipientName}, your wichty account has been successfully deleted. All your data has been removed. We hope to see you again soon!`,
      },
      buttonText: { de: "Neues Konto erstellen", en: "Create New Account" },
      getButtonUrl: () => baseUrl,
    },
  };

  const template = templates[content.type];
  const lang = content.language;

  return {
    subject: template.subject[lang],
    badge: template.badge[lang],
    title: template.title[lang],
    message: template.message[lang],
    buttonText: template.buttonText[lang],
    buttonUrl: template.getButtonUrl(),
    footerText: template.footerText?.[lang],
  };
}

export function generateEmailHtml(content: EmailContent): string {
  const { colors, styles, assets } = EMAIL_BRANDING;
  const language = content.language || "de";
  const footerBranding = EMAIL_BRANDING.footer[language];

  // Generate guide steps HTML if provided
  const guideStepsHtml = content.guideSteps
    ? content.guideSteps
        .map(
          (step, index) => `
        <tr>
          <td style="padding: ${index === 0 ? "24px" : "12px"} 24px ${index === content.guideSteps!.length - 1 ? "24px" : "12px"};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="top" style="padding-right: 16px;">
                  <div style="width: 40px; height: 40px; background-color: ${colors.badgeBg}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; text-align: center; line-height: 40px;">
                    ${step.icon}
                  </div>
                </td>
                <td valign="top">
                  <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: ${colors.textPrimary};">
                    ${step.title}
                  </p>
                  <p style="margin: 0; font-size: 14px; color: ${colors.textMuted}; line-height: 1.4;">
                    ${step.description}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
        )
        .join("")
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: ${colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: ${styles.maxWidth}; background-color: ${colors.card}; border-radius: ${styles.cardBorderRadius}; overflow: hidden; box-shadow: ${styles.boxShadow};">
              
              ${
                content.showLogo
                  ? `
              <!-- Logo Header -->
              <tr>
                <td style="padding: 32px 24px 16px; text-align: center;">
                  <img src="${assets.logoUrl}" alt="wichty" width="${assets.logoSize}" height="${assets.logoSize}" style="width: ${assets.logoSize}; height: ${assets.logoSize}; display: block; margin: 0 auto;">
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Header Badge -->
              <tr>
                <td style="padding: ${content.showLogo ? "16px" : "32px"} 24px 24px; text-align: center;">
                  <div style="display: inline-block; background-color: ${colors.badgeBg}; padding: 6px 16px; border-radius: ${styles.badgeBorderRadius}; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: ${colors.textMuted};">
                    ${content.badge}
                  </div>
                </td>
              </tr>
              
              <!-- Title -->
              <tr>
                <td style="padding: 0 24px 16px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.textPrimary};">
                    ${content.title}
                  </h1>
                </td>
              </tr>
              
              ${
                content.subtitle
                  ? `
              <!-- Subtitle -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
                    ${content.subtitle}
                  </p>
                </td>
              </tr>
              `
                  : ""
              }
              
              ${
                content.heroImageUrl
                  ? `
              <!-- Hero Image -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <img src="${content.heroImageUrl}" alt="Welcome" style="width: 100%; max-width: 400px; height: auto; border-radius: 12px; display: block; margin: 0 auto;">
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Message -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: ${colors.textSecondary}; line-height: 1.5;">
                    ${content.message}
                  </p>
                </td>
              </tr>
              
              ${guideStepsHtml}
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: ${content.guideSteps ? "8px" : "0"} 24px 32px; text-align: center;">
                  <a href="${content.buttonUrl}" style="display: inline-block; background-color: ${colors.buttonBg}; color: ${colors.buttonText}; text-decoration: none; padding: 14px 32px; border-radius: ${styles.buttonBorderRadius}; font-size: 16px; font-weight: 600;">
                    ${content.buttonText}
                  </a>
                </td>
              </tr>
              
              <!-- Divider -->
              <tr>
                <td style="padding: 0 24px;">
                  <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;">
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  ${
                    content.footerText
                      ? `
                  <p style="margin: 0 0 8px; font-size: 12px; color: ${colors.textLight};">
                    ${content.footerText}
                  </p>
                  `
                      : ""
                  }
                  <p style="margin: 0; font-size: 12px; color: ${colors.textLight};">
                    ${footerBranding}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Extended template for ticket emails with event details
export function generateTicketEmailHtml(content: {
  eventName: string;
  participantName: string;
  dateText?: string | null;
  timeText?: string | null;
  location?: string | null;
  ticketUrl: string;
  language: "de" | "en";
}): string {
  const { colors, styles } = EMAIL_BRANDING;
  const isGerman = content.language === "de";
  const footerBranding = EMAIL_BRANDING.footer[content.language];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: ${colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: ${styles.maxWidth}; background-color: ${colors.card}; border-radius: ${styles.cardBorderRadius}; overflow: hidden; box-shadow: ${styles.boxShadow};">
              <!-- Header -->
              <tr>
                <td style="padding: 32px 24px 24px; text-align: center;">
                  <div style="display: inline-block; background-color: ${colors.badgeBg}; padding: 6px 16px; border-radius: ${styles.badgeBorderRadius}; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: ${colors.textMuted};">
                    TICKET
                  </div>
                </td>
              </tr>
              
              <!-- Event Name -->
              <tr>
                <td style="padding: 0 24px 16px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.textPrimary};">
                    ${content.eventName}
                  </h1>
                </td>
              </tr>
              
              <!-- Event Details -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  ${
                    content.dateText
                      ? `
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">
                      📅 ${content.dateText}${content.timeText ? ` • ${content.timeText} ${isGerman ? "Uhr" : ""}` : ""}
                    </p>
                  `
                      : ""
                  }
                  ${
                    content.location
                      ? `
                    <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
                      📍 ${content.location}
                    </p>
                  `
                      : ""
                  }
                </td>
              </tr>
              
              <!-- Welcome Message -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: ${colors.textSecondary};">
                    ${
                      isGerman
                        ? `Hey ${content.participantName}, du bist dabei! 🎉`
                        : `Hey ${content.participantName}, you're in! 🎉`
                    }
                  </p>
                </td>
              </tr>
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 24px 32px; text-align: center;">
                  <a href="${content.ticketUrl}" style="display: inline-block; background-color: ${colors.buttonBg}; color: ${colors.buttonText}; text-decoration: none; padding: 14px 32px; border-radius: ${styles.buttonBorderRadius}; font-size: 16px; font-weight: 600;">
                    ${isGerman ? "Ticket ansehen" : "View Ticket"}
                  </a>
                </td>
              </tr>
              
              <!-- Divider -->
              <tr>
                <td style="padding: 0 24px;">
                  <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;">
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: ${colors.textLight};">
                    ${isGerman ? "Zeige dieses Ticket am Eingang vor." : "Show this ticket at the entrance."}
                  </p>
                  <p style="margin: 0; font-size: 12px; color: ${colors.textLight};">
                    ${footerBranding}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Generate notification email with event details section
export function generateNotificationEmailHtml(content: NotificationEmailContent): string {
  const { colors, styles } = EMAIL_BRANDING;
  const notificationContent = getNotificationContent(content);
  const footerBranding = EMAIL_BRANDING.footer[content.language];

  const hasEventDetails = content.eventDate || content.eventTime || content.eventLocation;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: ${colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: ${styles.maxWidth}; background-color: ${colors.card}; border-radius: ${styles.cardBorderRadius}; overflow: hidden; box-shadow: ${styles.boxShadow};">
              <!-- Header Badge -->
              <tr>
                <td style="padding: 32px 24px 24px; text-align: center;">
                  <div style="display: inline-block; background-color: ${colors.badgeBg}; padding: 6px 16px; border-radius: ${styles.badgeBorderRadius}; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: ${colors.textMuted};">
                    ${notificationContent.badge}
                  </div>
                </td>
              </tr>
              
              <!-- Title -->
              <tr>
                <td style="padding: 0 24px 16px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.textPrimary};">
                    ${notificationContent.title}
                  </h1>
                </td>
              </tr>
              
              ${hasEventDetails ? `
              <!-- Event Details -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  ${content.eventDate ? `
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">
                      📅 ${content.eventDate}${content.eventTime ? ` • ${content.eventTime} ${content.language === "de" ? "Uhr" : ""}` : ""}
                    </p>
                  ` : ""}
                  ${content.eventLocation ? `
                    <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
                      📍 ${content.eventLocation}
                    </p>
                  ` : ""}
                </td>
              </tr>
              ` : ""}
              
              <!-- Message -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: ${colors.textSecondary}; line-height: 1.5;">
                    ${notificationContent.message}
                  </p>
                </td>
              </tr>
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 24px 32px; text-align: center;">
                  <a href="${notificationContent.buttonUrl}" style="display: inline-block; background-color: ${colors.buttonBg}; color: ${colors.buttonText}; text-decoration: none; padding: 14px 32px; border-radius: ${styles.buttonBorderRadius}; font-size: 16px; font-weight: 600;">
                    ${notificationContent.buttonText}
                  </a>
                </td>
              </tr>
              
              <!-- Divider -->
              <tr>
                <td style="padding: 0 24px;">
                  <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;">
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  ${notificationContent.footerText ? `
                  <p style="margin: 0 0 8px; font-size: 12px; color: ${colors.textLight};">
                    ${notificationContent.footerText}
                  </p>
                  ` : ""}
                  <p style="margin: 0; font-size: 12px; color: ${colors.textLight};">
                    ${footerBranding}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
