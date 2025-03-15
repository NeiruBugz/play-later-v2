import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { name: 'Test User', image: 'test.jpg' },
  }),
}));

vi.mock('@chakra-ui/react', () => ({
  Avatar: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="avatar-root">{children}</div>
    ),
    Fallback: ({ name }: { name: string }) => (
      <div data-testid="avatar-fallback">{name}</div>
    ),
    Image: ({ src }: { src: string }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img data-testid="avatar-image" src={src} alt="avatar" />
    ),
  },
}));

describe('UserAvatar', () => {
  it('renders correctly with user data', async () => {
    const { UserAvatar } = await import('@/shared/components/ui/user');

    const result = await UserAvatar();

    const html = renderToString(result);

    expect(html).toContain('avatar-root');
    expect(html).toContain('avatar-fallback');
    expect(html).toContain('Test User');
    expect(html).toContain('avatar-image');
    expect(html).toContain('test.jpg');
  });

  it('returns null when there is no session', async () => {
    const authModule = await import('@/auth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authModule.auth as any).mockResolvedValueOnce(null);

    const { UserAvatar } = await import('@/shared/components/ui/user');

    const result = await UserAvatar();

    expect(result).toBeNull();
  });

  it('returns null when user has no name or image', async () => {
    const authModule = await import('@/auth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authModule.auth as any).mockResolvedValueOnce({
      user: {},
    });

    const { UserAvatar } = await import('@/shared/components/ui/user');

    const result = await UserAvatar();

    expect(result).toBeNull();
  });
});
