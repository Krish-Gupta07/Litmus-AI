import { templates } from './templates.js';
import { metaClient } from './meta-client.js';
import { WhatsAppService } from './service.js';

export class WhatsAppHandler {
  static async handleMessage(webhookBody: any): Promise<void> {
    try {
      const entry = webhookBody.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value?.messages?.[0]) {
        console.log('No message found in webhook');
        return;
      }

      const message = value.messages[0];
      const fromPhone = message.from;
      const messageText = message.text?.body?.trim();

      if (!messageText) {
        console.log('No text content in message');
        return;
      }

      console.log(`Received message from ${fromPhone}: ${messageText}`);

      // Handle commands
      if (messageText.toLowerCase() === '/help') {
        await metaClient.sendTextMessage(fromPhone, templates.help);
        return;
      }

      if (messageText.toLowerCase().startsWith('/litmus')) {
        await this.handleLitmusCommand(fromPhone, messageText);
        return;
      }

      // Default welcome message for any other text
      await metaClient.sendTextMessage(fromPhone, templates.welcome);
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
    }
  }

  private static async handleLitmusCommand(fromPhone: string, messageText: string): Promise<void> {
    try {
      // Extract content after /litmus
      const content = messageText.substring(7).trim(); // Remove '/litmus '
      
      if (!content) {
        await metaClient.sendTextMessage(fromPhone, templates.noContent);
        return;
      }

      // Send analyzing message
      await metaClient.sendTextMessage(fromPhone, templates.analyzing(content));

      // Queue the analysis job
      const jobId = await WhatsAppService.queueAnalysis(fromPhone, content);
      console.log(`Queued analysis job ${jobId} for phone ${fromPhone}`);

    } catch (error) {
      console.error('Error handling litmus command:', error);
      await metaClient.sendTextMessage(fromPhone, templates.error);
    }
  }

  static async handleJobResult(phoneNumber: string, result: any): Promise<void> {
    try {
      if (result.success) {
        const { title, description, credibilityScore, sources } = result.data;
        const message = templates.completed(
          title || 'Fact-Check Analysis',
          description || 'Analysis completed',
          credibilityScore || 0,
          sources
        );
        await metaClient.sendTextMessage(phoneNumber, message);
      } else {
        await metaClient.sendTextMessage(
          phoneNumber, 
          templates.failed(result.error || 'Unknown error')
        );
      }
    } catch (error) {
      console.error('Error handling job result:', error);
      await metaClient.sendTextMessage(phoneNumber, templates.error);
    }
  }
}
