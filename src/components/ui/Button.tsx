"use client";
import React, {
  useEffect,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";

import { getButtonClasses } from "@/lib/buttonStyles";
import { cn } from "@/lib/utils";
import Link from "next/link";
import URLParse from "url-parse";
import { Size, Variant } from "@/shared/types/button";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  active?: boolean;
  asChild?: boolean;
  target?: string;
  rel?: string;
  className?: string;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
    disabled?: boolean;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "disabled"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  children,
  className,
  variant = "default",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  active = false,
  asChild = false,
  href,
  target,
  rel,
  ...props
}: ButtonProps) {
  const buttonClasses = getButtonClasses({ variant, size, active });

  const isDisabled = "disabled" in props ? props.disabled || false : false;
  const linkRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  useEffect(() => {
    if (typeof window !== "undefined" && href && !asChild && typeof href === "string") {
      try {
        const parsedUrl = new URLParse(href, window.location.origin);
        const isInsecure = parsedUrl.protocol === "http:";
        const isLocalhost = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);

        if (isInsecure && !isLocalhost && process.env.NODE_ENV === "development") {
          console.warn(`Insecure external link detected. Please use HTTPS in production: ${href}`);
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
    }
  }, [href, asChild]);

  // Render <a> for href unless overridden with asChild
  if (href && !asChild) {
    return (
      <Link
        href={href}
        className={cn(buttonClasses, className)}
        target={target}
        rel={linkRel}
        role="link"
        aria-disabled={isDisabled || isLoading}
        aria-busy={isLoading}
        tabIndex={isDisabled || isLoading ? -1 : undefined}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Link>
    );
  }

  // Support for polymorphic components via asChild
  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error("Children must be a valid React element when asChild is true");
    }

    const child = children as ReactElement<{
      className?: string;
      disabled?: boolean;
      "aria-disabled"?: boolean;
      "aria-busy"?: boolean;
      children?: ReactNode;
    }>;

    const cloned = React.cloneElement(child, {
      ...props,
      className: cn(buttonClasses, child.props.className),
      disabled: isDisabled || isLoading,
      "aria-disabled": isDisabled || isLoading,
      "aria-busy": isLoading,
      children: (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {child.props.children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      ),
    });

    return cloned;
  }

  // Default <button> fallback
  return (
    <button
      className={cn(buttonClasses, className)}
      disabled={isDisabled || isLoading}
      aria-disabled={isDisabled || isLoading}
      aria-busy={isLoading}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-black dark:border-white rounded-full" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
