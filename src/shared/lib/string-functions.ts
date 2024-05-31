export function uppercaseToNormal(value?: string) {
  if (value === "PC") {
    return value;
  }
  return value ? `${value[0]}${value.slice(1).toLowerCase()}` : value;
}

export function nameFirstLiterals(name: string) {
  if (!name) {
    return "U";
  }

  const [firstName, lastName] = name.split(" ");
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName[0];
}

export const isURL = (str: string) => {
  const urlRegex = /^(?:https?|ftp):\/\/(?:\w+\.)+\w+(?:\/\S*)?$/;
  return urlRegex.test(str);
};
