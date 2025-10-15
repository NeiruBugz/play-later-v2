export function platformMapper(platformName: string): string {
  if (platformName.toLowerCase().includes("pc")) {
    return "PC";
  }

  if (platformName.toLowerCase().includes("playstation")) {
    const [, version] = platformName.split(" ");

    return `PS${version}`;
  }

  if (platformName.toLowerCase().includes("xbox series")) {
    return "Xbox Series";
  }

  return platformName;
}
