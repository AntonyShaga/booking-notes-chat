import { Button } from "@/components/ui/button";
import { CardAction, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Props {
  isLogin: boolean;
}

export function AuthHeader({ isLogin }: Props) {
  return (
    <>
      <CardTitle>{isLogin ? "Login to your account" : "Sign Up to your account"}</CardTitle>
      <CardDescription>
        {isLogin
          ? "Enter your email below to login to your account"
          : "Enter your email below to sign up to your account"}
      </CardDescription>
      <CardAction>
        <Link href={isLogin ? "/signup" : "/login"}>
          <Button variant="link" asChild>
            <span>{isLogin ? "Sign Up" : "Login"}</span>
          </Button>
        </Link>
      </CardAction>
    </>
  );
}
