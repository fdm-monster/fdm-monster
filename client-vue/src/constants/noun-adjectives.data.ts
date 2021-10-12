import adjectives from "@/assets/adjectives.json";
import nouns from "@/assets/nouns.json";

function capitalize(val: string) {
  if (!val) return "";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

export function newRandomNamePair() {
  const randomAdjective = Math.round(Math.random() * 1124);
  const randomNoun = Math.round(Math.random() * 3260);

  return `${capitalize(adjectives[randomAdjective])} ${capitalize(nouns[randomNoun])}`;
}

export function generateInitials(name: string) {
  if (name === null) return "?";
  const initials = name?.split(" ").reduce((acc, subname) => acc + subname[0], "");
  return initials?.replace("undefined", "");
}
