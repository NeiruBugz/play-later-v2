import type { ServiceResult } from "../types";

export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthUserData = {
  id: string;
  email: string;
  name: string | null;
};

export type SignUpResult = ServiceResult<{
  user: AuthUserData;
  message: string;
}>;

export type SignInResult = ServiceResult<{
  user: AuthUserData;
  message: string;
}>;
