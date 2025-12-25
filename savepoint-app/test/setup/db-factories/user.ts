import { type User } from "@prisma/client";

import { getTestDatabase } from "../database";
import { faker, seedFaker } from "../faker";

let userCounter = 0;

export type UserFactoryOptions = {
  email?: string;
  name?: string;
  username?: string;
  usernameNormalized?: string;
  steamId64?: string;
  steamUsername?: string;
  password?: string;
};

export const createUserData = (
  overrides: Partial<UserFactoryOptions> = {}
): UserFactoryOptions => {
  const uniqueId = ++userCounter;
  const username = overrides.username || `${faker.internet.username()}_${uniqueId}`;

  return {
    email: overrides.email || faker.internet.email(),
    name: overrides.name || faker.person.fullName(),
    username,
    usernameNormalized: overrides.usernameNormalized || username.toLowerCase(),
    steamId64: overrides.steamId64 || faker.string.numeric(17),
    steamUsername: overrides.steamUsername || faker.internet.username(),
    password: overrides.password,
  };
};

export const createSeededUserData = (
  seed: number = 12345,
  overrides?: Partial<UserFactoryOptions>
) => {
  seedFaker(seed);
  return createUserData(overrides);
};

export const createUser = async (
  options: UserFactoryOptions = {}
): Promise<User> => {
  const defaultData = createUserData(options);
  return getTestDatabase().user.create({
    data: defaultData,
  });
};

export const createUsers = async (
  count: number,
  options: UserFactoryOptions = {}
): Promise<User[]> => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser(options));
  }
  return users;
};
