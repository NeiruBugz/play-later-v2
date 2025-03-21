import { IconType } from 'react-icons';
import { IoLogoXbox } from 'react-icons/io5';
import {
  SiEpicgames,
  SiGogdotcom,
  SiNintendoswitch,
  SiSteam,
  SiPlaystation,
} from 'react-icons/si';

export const IGDB_WEBSITE_CATEGORY = {
  OFFICIAL: 1,
  WIKIA: 2,
  WIKIPEDIA: 3,
  FACEBOOK: 4,
  TWITTER: 5,
  TWITCH: 6,
  INSTAGRAM: 8,
  YOUTUBE: 9,
  IPHONE: 10,
  IPAD: 11,
  ANDROID: 12,
  STEAM: 13,
  REDDIT: 14,
  ITCH: 15,
  EPIC_GAMES: 16,
  GOG: 17,
  DISCORD: 18,
  GOOGLE_PLAY: 19,
  XBOX: 20,
  NINTENDO: 21,
  PLAYSTATION: 22,
} as const;

export type IGDBWebsiteCategory =
  (typeof IGDB_WEBSITE_CATEGORY)[keyof typeof IGDB_WEBSITE_CATEGORY];

type StoreInfo = {
  name: string;
  icon: IconType;
  color: string;
};

export const STORE_INFO: Record<IGDBWebsiteCategory, StoreInfo | undefined> = {
  [IGDB_WEBSITE_CATEGORY.STEAM]: {
    name: 'Steam',
    icon: SiSteam,
    color: '#1b2838', // Steam dark blue
  },
  [IGDB_WEBSITE_CATEGORY.EPIC_GAMES]: {
    name: 'Epic',
    icon: SiEpicgames,
    color: '#2f2f2f', // Epic dark gray
  },
  [IGDB_WEBSITE_CATEGORY.GOG]: {
    name: 'GOG',
    icon: SiGogdotcom,
    color: '#86198f', // GOG purple
  },
  [IGDB_WEBSITE_CATEGORY.XBOX]: {
    name: 'Microsoft',
    icon: IoLogoXbox,
    color: '#107C10', // Xbox green
  },
  [IGDB_WEBSITE_CATEGORY.NINTENDO]: {
    name: 'Nintendo',
    icon: SiNintendoswitch,
    color: '#e60012', // Nintendo red
  },
  [IGDB_WEBSITE_CATEGORY.PLAYSTATION]: {
    name: 'PlayStation',
    icon: SiPlaystation,
    color: '#003791', // PlayStation blue
  },
  [IGDB_WEBSITE_CATEGORY.OFFICIAL]: undefined,
  [IGDB_WEBSITE_CATEGORY.WIKIA]: undefined,
  [IGDB_WEBSITE_CATEGORY.WIKIPEDIA]: undefined,
  [IGDB_WEBSITE_CATEGORY.FACEBOOK]: undefined,
  [IGDB_WEBSITE_CATEGORY.TWITTER]: undefined,
  [IGDB_WEBSITE_CATEGORY.TWITCH]: undefined,
  [IGDB_WEBSITE_CATEGORY.INSTAGRAM]: undefined,
  [IGDB_WEBSITE_CATEGORY.YOUTUBE]: undefined,
  [IGDB_WEBSITE_CATEGORY.IPHONE]: undefined,
  [IGDB_WEBSITE_CATEGORY.IPAD]: undefined,
  [IGDB_WEBSITE_CATEGORY.ANDROID]: undefined,
  [IGDB_WEBSITE_CATEGORY.REDDIT]: undefined,
  [IGDB_WEBSITE_CATEGORY.ITCH]: undefined,
  [IGDB_WEBSITE_CATEGORY.DISCORD]: undefined,
  [IGDB_WEBSITE_CATEGORY.GOOGLE_PLAY]: undefined,
} as const;
