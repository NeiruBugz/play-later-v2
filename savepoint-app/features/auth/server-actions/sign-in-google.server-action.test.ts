import { signInWithGoogleAction } from "./sign-in-google";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("signInWithGoogleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to Better Auth social sign-in endpoint", async () => {
    await expect(signInWithGoogleAction()).rejects.toThrow(
      "NEXT_REDIRECT:/api/auth/sign-in/social?provider=cognito&callbackURL=/dashboard"
    );
  });
});
