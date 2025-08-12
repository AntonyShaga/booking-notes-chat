import Image from "next/image";

import CloseIcon from "@/components/icons/CloseIcon";
import { Button } from "@/components/ui/button";
type Props = {
  onClickToggle: () => void;
  userPicture: string | null;
  userName: string | null;
};

export default function UserInfoHeader({ onClickToggle, userPicture, userName }: Props) {
  const hasImage = userPicture && userPicture !== "";
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        {hasImage ? (
          <Image
            src={userPicture}
            alt="User avatar"
            width={32}
            height={32}
            priority
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-8 h-8 bg-blue-400 rounded-full"
            role="img"
            aria-label="User avatar placeholder"
          />
        )}
        <span className="text-sm">{userName ?? "User"}</span>
      </div>
      <Button className="rounded-sm bg-white p-2" aria-label="Close menu" onClick={onClickToggle}>
        <CloseIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
