export type ProfileSetupFormProps = {
  /**
   * Pre-filled username suggestion derived from the user's display name by
   * the `/profile/setup` loader. May be undefined when the display name has
   * no slug-able characters.
   */
  defaultUsername?: string;
};
