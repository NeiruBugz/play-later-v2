import { getTestDatabase } from "@/test/setup/database";
import { faker, seedFaker } from "@/test/setup/faker";
import { type User } from "@prisma/client";

let userCounter = 0;

export const resetUserCounter = () => {
  userCounter = 0;
};

export type UserFactoryOptions = {
  email?: string;
  name?: string;
  username?: string;
  usernameNormalized?: string;
  steamId64?: string;
  steamUsername?: string;
  steamAvatar?: string;
  steamProfileURL?: string;
  password?: string;
};

export const createUserData = (
  overrides: Partial<UserFactoryOptions> = {}
): UserFactoryOptions => {
  const uniqueId = ++userCounter;
  const username =
    overrides.username || `${faker.internet.username()}_${uniqueId}`;

  return {
    email: overrides.email || faker.internet.email(),
    name: overrides.name || faker.person.fullName(),
    username,
    usernameNormalized: overrides.usernameNormalized || username.toLowerCase(),
    steamId64: overrides.steamId64 || faker.string.numeric(17),
    steamUsername: overrides.steamUsername || faker.internet.username(),
    steamAvatar: overrides.steamAvatar || faker.image.avatar(),
    steamProfileURL:
      overrides.steamProfileURL ||
      `https://steamcommunity.com/profiles/${faker.string.numeric(17)}`,
    password: overrides.password,
  };
};

export const createSeededUserData = (
  seed: number = 12345,
  overrides?: Partial<UserFactoryOptions>
): ReturnType<typeof createUserData> => {
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
    // Clone options to avoid mutating the original object
    const clonedOptions = { ...options };

    // Make unique fields unique per user if they're provided in options
    if (clonedOptions.email) {
      clonedOptions.email = `${i}_${clonedOptions.email}`;
    }
    if (clonedOptions.username) {
      clonedOptions.username = `${clonedOptions.username}_${i}`;
      if (!clonedOptions.usernameNormalized) {
        clonedOptions.usernameNormalized = clonedOptions.username.toLowerCase();
      }
    }
    if (clonedOptions.usernameNormalized && !clonedOptions.username) {
      clonedOptions.username = `${clonedOptions.usernameNormalized}_${i}`;
      delete clonedOptions.usernameNormalized;
    }
    if (clonedOptions.steamId64) {
      clonedOptions.steamId64 = `${clonedOptions.steamId64}${i}`;
    }
    if (clonedOptions.steamUsername) {
      clonedOptions.steamUsername = `${clonedOptions.steamUsername}_${i}`;
    }

    users.push(await createUser(clonedOptions));
  }
  return users;
};
