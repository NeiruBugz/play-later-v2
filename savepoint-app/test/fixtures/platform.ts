export const platformApiResponseFixture = {
  success: true,
  data: {
    supportedPlatforms: [
      {
        id: "1",
        igdbId: 167,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
        alternativeName: null,
        generation: 9,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    otherPlatforms: [
      {
        id: "2",
        igdbId: 6,
        name: "PC",
        slug: "pc",
        abbreviation: "PC",
        alternativeName: null,
        generation: null,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
};
