import { Button } from "@/components/ui/button";

interface Props {
  isLogin: boolean;
}

export function AuthProviders({ isLogin }: Props) {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };
  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github";
  };
  return (
    <>
      <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
        {isLogin ? "Login" : "Sign Up"} with Google
      </Button>
      <Button variant="outline" className="w-full" onClick={handleGitHubLogin}>
        {isLogin ? "Login" : "Sign Up"} with GitHub
      </Button>
    </>
  );
}
