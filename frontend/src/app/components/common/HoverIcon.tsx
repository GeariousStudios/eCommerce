import { ElementType } from "react";

type Props = {
  outline: ElementType;
  solid: ElementType;
  className?: string;
};

const HoverIcon = (props: Props) => {
  return (
    <span className={`relative ${props.className ?? ""}`}>
      <props.outline className="absolute opacity-100 transition-opacity duration-[var(--fast)] group-hover:opacity-0" />
      <props.solid className="absolute opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100" />
    </span>
  );
};

export default HoverIcon;
