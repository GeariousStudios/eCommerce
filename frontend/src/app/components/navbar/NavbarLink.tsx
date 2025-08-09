import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType, useState } from "react";
import CustomTooltip from "../common/CustomTooltip";
import HoverIcon from "../common/HoverIcon";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";

type IconName = keyof typeof Solid;

type Props = {
  href: string;
  label: string;
  icon?: IconName | string;
  disabled?: boolean;
  tooltip?: string;

  overrideLabel?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (isFavourite: boolean, href: string) => void;

  isDragging?: boolean;
};

const NavbarLink = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Other ---
  const pathname = usePathname();
  const strip = (s: string) => s.replace(/\/+$/, "") || "/";
  const isActive = strip(pathname) === strip(props.href);

  const OutlineIcon = props.icon
    ? (Outline as Record<string, ElementType>)[props.icon]
    : undefined;

  const SolidIcon = props.icon
    ? (Solid as Record<string, ElementType>)[props.icon]
    : undefined;

  const hasIcon = !!OutlineIcon || !!SolidIcon;

  const handleFavouriteToggle = () => {
    props.onToggleFavourite?.(!!props.isFavourite, props.href);
  };

  return (
    <>
      <CustomTooltip
        content={props.isDragging ? "" : (props.tooltip ?? "")}
        side="right"
        showOnTouch
        mediumDelay
      >
        <Link
          href={props.href}
          aria-disabled={props.isDragging || props.disabled ? true : undefined}
          onClick={(e) => {
            if (props.isDragging) {
              e.preventDefault();
            }
          }}
          className={`${isActive ? "text-[var(--accent-color)]" : ""} ${props.disabled ? "cursor-not-allowed opacity-33" : ""} ${props.isDragging ? "" : "hover:bg-[var(--bg-navbar-link)]"} group/link flex min-h-[40px] w-full max-w-full items-center justify-between gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)]`}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            {hasIcon && (
              <span className="relative flex min-h-6 min-w-6 items-center">
                {OutlineIcon && (
                  <OutlineIcon
                    className={`${isActive ? "opacity-0" : "opacity-100"} ${!props.isDragging ? "group-hover/link:opacity-0" : ""} absolute transition-opacity duration-[var(--fast)]`}
                    aria-hidden
                  />
                )}
                {SolidIcon && (
                  <SolidIcon
                    className={`${isActive ? "opacity-100" : "opacity-0"} ${!props.isDragging ? "text-[var(--accent-color)] group-hover/link:opacity-100" : ""} absolute transition-opacity duration-[var(--fast)]`}
                    aria-hidden
                  />
                )}
              </span>
            )}

            <span className={`${isActive ? "font-bold" : ""} flex`}>
              {props.label}
            </span>
          </div>

          {props.onToggleFavourite && (
            <CustomTooltip
              content={
                props.isFavourite && !props.disabled
                  ? t("Navbar/Remove favourite")
                  : !props.isFavourite && !props.disabled
                    ? t("Navbar/Set favourite")
                    : ""
              }
              longDelay
            >
              <button
                className={`${props.isDragging ? "opacity-0" : "opacity-0 group-hover/link:opacity-100"} ${props.disabled ? "cursor-not-allowed" : ""} group ml-auto flex`}
                onClick={(e) => {
                  e.preventDefault();

                  if (!props.disabled) {
                    handleFavouriteToggle();
                  }
                }}
              >
                {!props.isFavourite ? (
                  <HoverIcon
                    outline={Outline.StarIcon}
                    solid={Solid.StarIcon}
                    className="h-5 min-h-5 w-5 min-w-5"
                  />
                ) : (
                  <Solid.StarIcon className="h-5 min-h-5 w-5 min-w-5" />
                )}
              </button>
            </CustomTooltip>
          )}
        </Link>
      </CustomTooltip>
    </>
  );
};

export default NavbarLink;
