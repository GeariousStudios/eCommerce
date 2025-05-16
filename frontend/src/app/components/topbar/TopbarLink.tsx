import Link from "next/link";
import { ElementType, useState } from "react";

type Props = {
  href?: string;
  onClick?: () => void;
  label: string;
  icon?: ElementType;
  iconHover: ElementType;
};

const TopbarLink = (props: Props) => {
  // States.
  const [onHover, setOnHover] = useState(false);

  // Mouse enter.
  const mouseEnter = () => {
    if (!onHover) {
      setOnHover(true);
    }
  };

  // Mouse leave.
  const mouseLeave = () => {
    if (onHover) {
      setOnHover(false);
    }
  };

  // Icon.
  const Icon = onHover && props.iconHover ? props.iconHover : props.icon;

  return (
    <div>
      {props.href ? (
        <Link
          onMouseEnter={() => setOnHover(true)}
          onMouseLeave={() => setOnHover(false)}
          href={props.href}
          className="flex h-[38px] w-full cursor-pointer items-center gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)] hover:bg-[var(--bg-topbar-link)] md:justify-between"
        >
          <span className="flex items-center gap-4">
            {Icon && (
              <Icon
                className={`${onHover ? "text-[var(--accent-color)]" : ""} flex h-6 w-6 transition-colors duration-[var(--fast)]`}
              />
            )}
            <span className="overflow-hidden whitespace-nowrap">
              {props.label}
            </span>
          </span>
        </Link>
      ) : (
        <button
          onMouseEnter={() => setOnHover(true)}
          onMouseLeave={() => setOnHover(false)}
          onClick={props.onClick}
          className="flex h-[38px] w-full cursor-pointer items-center gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)] hover:bg-[var(--bg-topbar-link)] md:justify-between"
        >
          <span className="flex items-center gap-4">
            {Icon && (
              <Icon
                className={`${onHover ? "text-[var(--accent-color)]" : ""} flex h-6 w-6 transition-colors duration-[var(--fast)]`}
              />
            )}
            <span className="overflow-hidden whitespace-nowrap">
              {props.label}
            </span>
          </span>
        </button>
      )}
    </div>
  );
};

export default TopbarLink;
