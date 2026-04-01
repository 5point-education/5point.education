const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Format phone number for Meta WhatsApp API
 * Takes a standard phone number and formats it to digits only with country code.
 * Example: "9876543210" -> "919876543210"
 */
function formatWhatsAppNumber(phone: string): string {
  // Remove spaces, dashes, +, etc.
  let cleaned = phone.replace(/\D/g, '');
  
  // If no country code, assume India (91)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  
  return cleaned;
}

export const WhatsAppService = {
  /**
   * Send a free-form WhatsApp text message using Meta API
   * 
   * ⚠️ CRITICAL META API RULE:
   * Free-form text messages will ONLY be delivered if the user has sent a message 
   * to your WhatsApp number within the last 24 hours. The API will return 200 OK 
   * and a message ID, but the message will be silently dropped by the network if 
   * there is no active 24-hour session.
   * 
   * FIX FOR TESTING: Send any message (e.g. "Hi") from your phone to the test number first!
   */
  sendMessage: async (toPhone: string, bodyText: string) => {
    if (!accessToken || !phoneNumberId) {
      console.warn('Meta WhatsApp credentials not configured. Skipping message.');
      return false;
    }

    try {
      const formattedNumber = formatWhatsAppNumber(toPhone);
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "text",
        text: { 
            preview_url: false,
            body: bodyText
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Failed to send WhatsApp text to ${toPhone}:`, result);
        return false;
      }

      console.log(`WhatsApp text sent to ${formattedNumber}. Message ID: ${result.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      console.error(`Error sending WhatsApp text to ${toPhone}:`, error);
      return false;
    }
  },

  /**
   * Send a pre-approved Message Template
   * Templates bypass the 24-hour rule and can initiate conversations.
   * You must create and approve these templates in your Meta Business account.
   */
  sendTemplateMessage: async (toPhone: string, templateName: string, languageCode: string = "en_US", components: any[] = []) => {
    if (!accessToken || !phoneNumberId) {
      console.warn('Meta WhatsApp credentials not configured. Skipping template message.');
      return false;
    }

    try {
      const formattedNumber = formatWhatsAppNumber(toPhone);
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "template",
        template: { 
            name: templateName,
            language: { code: languageCode },
            components: components // Pass variable values here if your template has {{1}}, {{2}}, etc.
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Failed to send WhatsApp template ${templateName} to ${toPhone}:`, result);
        return false;
      }

      console.log(`WhatsApp template ${templateName} sent to ${formattedNumber}. Message ID: ${result.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      console.error(`Error sending WhatsApp template to ${toPhone}:`, error);
      return false;
    }
  },

  /**
   * 1. Student Absence Notification
   * REQUIRES META TEMPLATE: e.g. "Hello, this is to inform you that {{1}} was marked absent today ({{2}}). If you have any questions, please contact the administration."
   */
  sendAbsenceNotification: async (phone: string, studentName: string, date: string) => {
    return WhatsAppService.sendTemplateMessage(
      phone,
      "absence_notification", // Replace with your approved template name
      "en", // Replace with your template's language code
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName },
            { type: "text", text: date }
          ]
        }
      ]
    );
  },

  /**
   * 2. Marks Submission
   * REQUIRES META TEMPLATE
   */
  sendMarksUpdated: async (phone: string, studentName: string, examName: string, score: number) => {
    return WhatsAppService.sendTemplateMessage(
      phone,
      "marks_updated",
      "en",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: examName },
            { type: "text", text: studentName },
            { type: "text", text: score.toString() }
          ]
        }
      ]
    );
  },

  /**
   * 5. Important Announcements
   * REQUIRES META TEMPLATE: e.g. "Announcement: {{1}}\n\n{{2}}"
   */
  sendAnnouncement: async (phone: string, title: string, body: string) => {
    // Note: If you don't want to use templates for announcements, you might need to broadcast 
    // using WhatsApp marketing templates.
    return WhatsAppService.sendTemplateMessage(
      phone,
      "announcement_alert", 
      "en",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: title },
            { type: "text", text: body }
          ]
        }
      ]
    );
  },

  /**
   * 6. Fee Due Reminder
   * REQUIRES META TEMPLATE: e.g. "Reminder: An amount of ₹{{1}} is pending for {{2}} by {{3}}."
   */
  sendFeeReminder: async (phone: string, studentName: string, amount: number, dueDate?: string) => {
    const dueDateStr = dueDate ? dueDate : 'soon';
    return WhatsAppService.sendTemplateMessage(
      phone,
      "fee_reminder",
      "en",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: amount.toString() },
            { type: "text", text: studentName },
            { type: "text", text: dueDateStr }
          ]
        }
      ]
    );
  },

  /**
   * 7. Class Schedule Changes
   */
  sendScheduleChange: async (phone: string, batchName: string, newSchedule: string) => {
    return WhatsAppService.sendTemplateMessage(
      phone,
      "schedule_change",
      "en",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: batchName },
            { type: "text", text: newSchedule }
          ]
        }
      ]
    );
  }
};
