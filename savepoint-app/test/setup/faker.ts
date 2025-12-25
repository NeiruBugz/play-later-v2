import { faker } from "@faker-js/faker";

export const seedFaker = (seed: number = 12345): void => {
  faker.seed(seed);
};

export { faker };
