import Image from "next/image";

export function UserAvatar({ picture, name }: { picture: string; name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  const altText = name ? `Аватар пользователя ${name}` : "Аватар пользователя";

  return (
    <div className="flex items-center gap-2" aria-label={altText}>
      {picture ? (
        <Image
          src={picture}
          alt={altText}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white"
          aria-hidden="true"
        >
          {initial}
        </div>
      )}
      <span className="text-sm">{name}</span>
    </div>
  );
}
