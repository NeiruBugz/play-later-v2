export const signUpInputFixture = {
  email: "NewUser@Example.COM",
  password: "securepassword123",
  name: "John Doe",
};

export const signUpInputWithoutNameFixture = {
  email: "NewUser@Example.COM",
  password: "securepassword123",
  name: undefined,
};

export const signUpInputForExistingUserFixture = {
  email: "existing@example.com",
  password: "securepassword123",
  name: "John Doe",
};

export const signUpInputForUniqueConstraintViolationFixture = {
  email: "newuser@example.com",
  password: "securepassword123",
  name: "John Doe",
};

export const createdUserFixture = {
  id: "user-123",
  email: "newuser@example.com",
  name: "John Doe",
};

export const createdUserWithoutNameFixture = {
  id: "user-123",
  email: "newuser@example.com",
  name: null,
};

export const createdUserWithNullEmailFixture = {
  id: "user-123",
  email: null, // Edge case: email is null
  name: "John Doe",
};

export const existingUserFixture = {
  id: "user-456",
  email: "existing@example.com",
  name: "Existing User",
  emailVerified: null,
  image: null,
  password: "$2a$10$existinghashedpassword",
  username: null,
  steamProfileURL: null,
  steamId64: null,
  steamUsername: null,
  steamAvatar: null,
  steamConnectedAt: null,
};

export const signInInputFixture = {
  email: "user@example.com",
  password: "password123",
};
