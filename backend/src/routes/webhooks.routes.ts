import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Webhook } from 'svix';
// import type { WebhookEvent } from '@clerk/nextjs/server';

const router = Router();
const prisma = new PrismaClient();

// Define the webhook event type locally
interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
  };
}

// Clerk webhook endpoint
router.post('/clerk', async (req, res) => {

  console.log('Clerk webhook received');

  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
    }

    // Get the headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Get the raw body (Buffer) and verify
    const body = req.body instanceof Buffer ? req.body : Buffer.from(req.body);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({ error: 'Error verifying webhook' });
    }

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === 'user.created') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (email) {
        await prisma.user.create({
          data: {
            id,
            email,
          },
        });
        console.log(`✅ User created: ${id} (${email})`);
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (email) {
        await prisma.user.upsert({
          where: { id },
          update: { email },
          create: { id, email },
        });
        console.log(`✅ User updated: ${id} (${email})`);
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      await prisma.user.delete({
        where: { id },
      });
      console.log(`✅ User deleted: ${id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
