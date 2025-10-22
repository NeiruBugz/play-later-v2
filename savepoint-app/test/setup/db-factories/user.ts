import { type User } from "@prisma/client";

import { testDataBase } from "../database";

export type UserFactoryOptions = {
  email?: string;
  name?: string;
  username?: string;
  usernameNormalized?: string;
  steamId64?: string;
  steamUsername?: string;
  password?: string;
};

export const createUser = async (
  options: UserFactoryOptions = {}
): Promise<User> => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const username = options.username ?? `testuser${timestamp}${randomSuffix}`;

  const defaultData = {
    email: `user-${timestamp}-${randomSuffix}@example.com`,
    name: `Test User ${timestamp}`,
    username,
    usernameNormalized: options.usernameNormalized ?? username.toLowerCase(),
    password: options.password,
    ...options,
  };

  return testDataBase.user.create({
    data: defaultData,
  });
};

export const createUsers = async (
  count: number,
  options: UserFactoryOptions = {}
): Promise<User[]> => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    users.push(
      await createUser({
        ...options,
        email: `user-${timestamp}-${i}-${randomSuffix}@example.com`,
        username: `testuser${timestamp}${i}${randomSuffix}`,
      })
    );
  }
  return users;
};
