// Email Branding Constants for wichty
// All emails must use these constants for consistent branding

export const EMAIL_BRANDING = {
  colors: {
    background: '#f5f5f5',
    card: '#ffffff',
    buttonBg: '#1a1a1a',
    buttonText: '#ffffff',
    textPrimary: '#1a1a1a',
    textSecondary: '#333',
    textMuted: '#666',
    textLight: '#999',
    border: '#eee',
    badgeBg: '#f0f0f0',
  },
  styles: {
    cardBorderRadius: '16px',
    buttonBorderRadius: '12px',
    badgeBorderRadius: '20px',
    maxWidth: '480px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sender: {
    tickets: 'wichty <tickets@wichty.com>',
    noreply: 'wichty <noreply@wichty.com>',
  },
  footer: {
    de: 'Gesendet mit ❤️ von wichty.de',
    en: 'Sent with ❤️ by wichty.de',
  },
};

export interface EmailContent {
  badge: string;
  title: string;
  subtitle?: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  footerText?: string;
  language?: 'de' | 'en';
}

export function generateEmailHtml(content: EmailContent): string {
  const { colors, styles } = EMAIL_BRANDING;
  const language = content.language || 'de';
  const footerBranding = EMAIL_BRANDING.footer[language];

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
              
              ${content.subtitle ? `
              <!-- Subtitle -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
                    ${content.subtitle}
                  </p>
                </td>
              </tr>
              ` : ''}
              
              <!-- Message -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: ${colors.textSecondary}; line-height: 1.5;">
                    ${content.message}
                  </p>
                </td>
              </tr>
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 24px 32px; text-align: center;">
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
                  ${content.footerText ? `
                  <p style="margin: 0 0 8px; font-size: 12px; color: ${colors.textLight};">
                    ${content.footerText}
                  </p>
                  ` : ''}
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
  language: 'de' | 'en';
}): string {
  const { colors, styles } = EMAIL_BRANDING;
  const isGerman = content.language === 'de';
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
                  ${content.dateText ? `
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">
                      📅 ${content.dateText}${content.timeText ? ` • ${content.timeText} ${isGerman ? 'Uhr' : ''}` : ''}
                    </p>
                  ` : ''}
                  ${content.location ? `
                    <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
                      📍 ${content.location}
                    </p>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Welcome Message -->
              <tr>
                <td style="padding: 0 24px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: ${colors.textSecondary};">
                    ${isGerman 
                      ? `Hey ${content.participantName}, du bist dabei! 🎉` 
                      : `Hey ${content.participantName}, you're in! 🎉`}
                  </p>
                </td>
              </tr>
              
              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 24px 32px; text-align: center;">
                  <a href="${content.ticketUrl}" style="display: inline-block; background-color: ${colors.buttonBg}; color: ${colors.buttonText}; text-decoration: none; padding: 14px 32px; border-radius: ${styles.buttonBorderRadius}; font-size: 16px; font-weight: 600;">
                    ${isGerman ? 'Ticket ansehen' : 'View Ticket'}
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
                    ${isGerman 
                      ? 'Zeige dieses Ticket am Eingang vor.' 
                      : 'Show this ticket at the entrance.'}
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
