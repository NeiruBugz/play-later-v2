import { auth } from '@/auth';

export const getServerUserId = async () => {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return;
    }

    return session.user.id;
  } catch (error) {
    console.error(error);
  }
};
