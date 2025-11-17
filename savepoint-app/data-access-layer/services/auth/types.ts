import type { ServiceResult } from "../types";

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
export type SignUpResult = ServiceResult<{
  user: AuthUserData;
  message: string;
}>;
