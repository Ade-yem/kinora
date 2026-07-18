import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "dark" | "outline" | "outline-dark";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-volt text-ink",
  dark: "bg-ink text-cream",
  outline: "border-[1.5px] border-ink/15 text-ink",
  "outline-dark": "border-[1.5px] border-cream/25 text-cream",
};

const baseClasses =
  "block w-full rounded-2xl py-4 text-center font-display text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-40";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Renders as a navigation link instead of a <button>. */
  href?: string;
}

export function Button({ variant = "primary", href, className = "cursor-pointer", ...props }: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return <button className={classes} {...props} />;
}
