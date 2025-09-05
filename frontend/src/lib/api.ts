import { auth } from '@clerk/nextjs/server';

export async function createAuthenticatedRequest() {
  const { userId } = await auth();
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId || '',
    },
  };
}
