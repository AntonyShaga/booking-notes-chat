import Image from "next/image";

type Props = {
  picture: string;
  name: string;
};

export function UserAvatar({ picture, name }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={picture}
        alt="User avatar"
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover"
      />
      <span className="text-sm">{name}</span>
    </div>
  );
}
