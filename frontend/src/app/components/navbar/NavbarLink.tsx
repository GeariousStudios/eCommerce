import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType } from "react";
import CustomTooltip from "../common/CustomTooltip";
import HoverIcon from "../common/HoverIcon";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";

type IconName = keyof typeof Solid;

type Props = {
  href: string;
  label: string;
  icon?: IconName | string;
  disabled?: boolean;
  tooltip?: string;

  overrideLabel?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (
    isFavourite: boolean,
    href: string,
    label: string,
    icon: string,
  ) => void;
};

const NavbarLink = (props: Props) => {
  const pathname = usePathname();
  const strip = (s: string) => s.replace(/\/+$/, "") || "/";
  const isActivePath = (path: string, href: string) => {
    const p = strip(path);
    const h = strip(href);

    if (h === "/") return p === "/";

    if (!p.startsWith(h)) return false;

    const rest = p.slice(h.length);
    return rest === "" || rest.startsWith("/");
  };

  const isActive = isActivePath(pathname, props.href);

  const OutlineIcon = props.icon
    ? (Outline as Record<string, ElementType>)[props.icon]
    : undefined;

  const SolidIcon = props.icon
    ? (Solid as Record<string, ElementType>)[props.icon]
    : undefined;

  const hasIcon = !!OutlineIcon || !!SolidIcon;

  const handleFavouriteToggle = () => {
    props.onToggleFavourite?.(
      !!props.isFavourite,
      props.href,
      props.overrideLabel ?? props.label,
      props.icon ?? "",
    );
  };

  return (
    <>
      <CustomTooltip
        content={props.tooltip ? props.tooltip : ""}
        side="right"
        showOnTouch
      >
        <Link
          href={props.href}
          className={`${isActive ? "text-[var(--accent-color)]" : ""} ${props.disabled ? "cursor-not-allowed opacity-33" : ""} group/link flex min-h-[40px] w-full max-w-full items-center justify-between gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)]`}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            {hasIcon && (
              <span className="relative flex min-h-6 min-w-6 items-center">
                {OutlineIcon && (
                  <OutlineIcon
                    className={`${isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover/link:opacity-0`}
                    aria-hidden
                  />
                )}
                {SolidIcon && (
                  <SolidIcon
                    className={`${isActive ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover/link:opacity-100`}
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
            <button
              className="group ml-auto flex opacity-0 group-hover/link:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                handleFavouriteToggle();
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
          )}
        </Link>
      </CustomTooltip>
    </>
  );
};

export default NavbarLink;
