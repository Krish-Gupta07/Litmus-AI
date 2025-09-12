import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface TextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export class MetaWhatsAppClient {
  static async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      const payload: TextMessage = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${WHATSAPP_API_URL}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Message sent to ${to}`);
      return true;

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  static async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `${WHATSAPP_API_URL}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }
}

export const metaClient = {
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    return MetaWhatsAppClient.sendTextMessage(to, message);
  },

  async markAsRead(messageId: string): Promise<void> {
    return MetaWhatsAppClient.markAsRead(messageId);
  }
};
