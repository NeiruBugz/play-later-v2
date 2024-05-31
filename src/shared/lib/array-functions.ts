import type { BackloggedWithUser } from "@/src/shared/types/backlogs";

export function getRandomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export const groupByUserName = (data?: BackloggedWithUser[]) => {
  if (!data) {
    return [];
  }

  const groupedData: Record<string, BackloggedWithUser[]> = {};
  data.forEach((item) => {
    const userName = item.user.name;
    if (!userName) {
      return;
    }
    if (!groupedData[userName]) {
      groupedData[userName] = [];
    }
    groupedData[userName].push(item);
  });
  return groupedData;
};
