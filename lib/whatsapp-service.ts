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
   */
  sendAbsenceNotification: async (phone: string, studentName: string, date: string) => {
    const message = `Hello, this is to inform you that ${studentName} was marked absent today (${date}). If you have any questions, please contact the administration.`;
    return WhatsAppService.sendMessage(phone, message);
  },

  /**
   * 2. Marks Submission
   */
  sendMarksUpdated: async (phone: string, studentName: string, examName: string, score: number) => {
    const message = `Hello! The results for the "${examName}" exam have been updated. ${studentName} scored ${score}. Log in to the portal for more details.`;
    return WhatsAppService.sendMessage(phone, message);
  },

  /**
   * 5. Important Announcements
   */
  sendAnnouncement: async (phone: string, title: string, body: string) => {
    const message = `*Announcement: ${title}*\n\n${body}`;
    return WhatsAppService.sendMessage(phone, message);
  },

  /**
   * 6. Fee Due Reminder
   */
  sendFeeReminder: async (phone: string, studentName: string, amount: number, dueDate?: string) => {
    const dueDateStr = dueDate ? ` by ${dueDate}` : '';
    const message = `Reminder: An amount of ₹${amount} is pending for ${studentName}${dueDateStr}. Please complete the payment to avoid interruption of services.`;
    return WhatsAppService.sendMessage(phone, message);
  },

  /**
   * 7. Class Schedule Changes
   */
  sendScheduleChange: async (phone: string, batchName: string, newSchedule: string) => {
    const message = `Update: The schedule for ${batchName} has been updated. The new schedule is: ${newSchedule}.`;
    return WhatsAppService.sendMessage(phone, message);
  }
};
