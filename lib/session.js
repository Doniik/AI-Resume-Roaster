import { getServerSession } from 'next-auth/next';
import { authOptions } from './authOptions';

export async function getAuthenticatedUserId(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return session?.user?.id || null;
}