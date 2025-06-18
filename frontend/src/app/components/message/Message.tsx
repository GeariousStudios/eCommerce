"use client";

import { hyperLinkButtonClass } from "@/app/styles/buttonClasses";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  FaceFrownIcon,
  IdentificationIcon,
  MagnifyingGlassCircleIcon,
  NoSymbolIcon,
  UserIcon,
  TagIcon,
  InboxIcon,
  InboxStackIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { ElementType, ReactNode, useEffect, useState } from "react";

type Props = {
  content?: string;
  icon?: string;
  fullscreen?: boolean;
  withinContainer?: boolean;
  sideMessage?: boolean;
};

const iconMap: Record<string, ElementType> = {
  loading: ArrowPathIcon,
  deny: IdentificationIcon,
  server: NoSymbolIcon,
  user: UserIcon,
  category: TagIcon,
  unit: InboxIcon,
  unitGroup: InboxStackIcon,
  beware: ExclamationCircleIcon,
  search: MagnifyingGlassCircleIcon,
  lock: LockClosedIcon,
  work: WrenchScrewdriverIcon,
};

const contentMap: Record<string, ReactNode> = {
  loading: "Laddar...",
  auth: "Autentiserar...",
  deny: (
    <div className="flex flex-col">
      <span>Obehörig access!</span>{" "}
      <span>
        <Link href="/" className={`${hyperLinkButtonClass}`}>
          Klicka här
        </Link>{" "}
        för att logga in.
      </span>
    </div>
  ),
  server: "Ingen kontakt med servern, försök igen senare!",
  lock: (
    <div className="flex flex-col">
      <span>Sidan är ej tillgänglig för tillfället!</span>{" "}
      <span>Försök igen senare.</span>
    </div>
  ),
  fof: (
    <div className="flex flex-col">
      <span>Sidan kunde inte hittas.</span>
    </div>
  ),
};

const Message = (props: Props) => {
  const [Icon, setIcon] = useState<ElementType | null>(null);

  useEffect(() => {
    setIcon(() => (props.icon ? (iconMap[props.icon] ?? null) : null));
  }, [props.icon]);

  const content = (props.content && contentMap[props.content]) ?? props.content;

  return (
    <div
      className={`${props.fullscreen ? "fixed inset-0 overflow-auto" : "h-full grow"} ${!props.withinContainer && props.fullscreen ? "ml-18 md:ml-64" : props.withinContainer && props.fullscreen && ""} flex items-center justify-center`}
    >
      <div
        className={`${props.sideMessage ? "" : "flex-col"} flex items-center gap-3 opacity-75`}
      >
        {props.icon && Icon ? (
          <Icon
            className={`${props.icon === "loading" ? "motion-safe:animate-[spin_2s_linear_infinite]" : ""} h-8 w-8`}
          />
        ) : props.icon ? (
          <div className="h-8 w-8" />
        ) : (
          <FaceFrownIcon className="h-8 w-8" />
        )}
        {content && <span className="text-center">{content}</span>}
      </div>
    </div>
  );
};

export default Message;
