import { QueueService } from '../../services/queue.js';

export class WhatsAppService {
  static async queueAnalysis(phoneNumber: string, content: string): Promise<string> {
    try {
      const job = await QueueService.addJob({
        userId: phoneNumber, // Use phone number as user ID for WhatsApp
        input: content,
        inputType: 'text' as const,
        text: content
      });

      console.log(`Queued analysis job ${job.id} for WhatsApp user ${phoneNumber}`);
      return job.id || 'unknown';
    } catch (error) {
      console.error('Error queuing WhatsApp analysis:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
