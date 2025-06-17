// cover_small	90 x 12
// screenshot_med	569 x 320
// cover_big	264 x 352
// logo_med	284 x 160
// screenshot_big	889 x 500
// screenshot_huge	1280 x 720
// thumb	90 x 90
// micro	35 x 35

export const NEXT_IMAGE_SIZES = {
  "c-big": {
    height: 352,
    width: 264,
  },
  "c-sm": {
    height: 120,
    width: 90,
  },
  "full-hd": {
    height: 959,
    width: 719,
  },
  hd: {
    height: 720,
    width: 520,
  },
  logo: {
    height: 160,
    width: 120,
  },
  micro: {
    height: 40,
    width: 40,
  },
  "s-big": {
    height: 529,
    width: 940,
  },
  "s-huge": {
    height: 720,
    width: 1280,
  },
  "s-md": {
    height: 312,
    width: 555,
  },
  thumb: {
    height: 90,
    width: 90,
  },
} as const;

export const IMAGE_SIZES = {
  "c-big": "t_cover_big",
  "c-sm": "t_cover_small",
  "full-hd": "t_1080p",
  hd: "t_720p",
  logo: "t_logo_med",
  micro: "t_micro",
  "s-big": "t_screenshot_big",
  "s-huge": "t_screenshot_huge",
  "s-md": "t_screenshot_med",
  thumb: "t_thumb",
} as const;

export const IMAGE_API = "https://images.igdb.com/igdb/image/upload";
