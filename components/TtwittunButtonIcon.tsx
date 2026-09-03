import Image from "next/image";

const iconSources = {
  back: "/button-icons/back.png",
  run: "/button-icons/run.png",
  map: "/button-icons/map.png",
  favorite: "/button-icons/favorite.png",
  save: "/button-icons/save.png",
  race: "/button-icons/race.png",
  shoe: "/button-icons/shoe.png",
  food: "/button-icons/run-eat.png",
} as const;

export type TtwittunIconName = keyof typeof iconSources;

export default function TtwittunButtonIcon({ name, compact = false }: { name: TtwittunIconName; compact?: boolean }) {
  return (
    <span className={`ttwittunButtonIcon${compact ? " compact" : ""}`} aria-hidden="true">
      <Image src={iconSources[name]} alt="" width={64} height={64} sizes="32px" />
    </span>
  );
}
