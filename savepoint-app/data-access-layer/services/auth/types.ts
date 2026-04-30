export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};
export type AuthUserData = {
  id: string;
  email: string;
  name: string | null;
};
export type SignUpResult = {
  user: AuthUserData;
  message: string;
};
