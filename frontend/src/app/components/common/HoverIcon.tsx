import { ElementType } from "react";

type Props = {
  outline: ElementType;
  solid: ElementType;
  className?: string;
  active?: boolean;
};

const HoverIcon = (props: Props) => {
  return (
    <span className={`relative ${props.className ?? ""}`}>
      <props.outline
        className={`${props.active ? "opacity-0" : "opacity-100 group-hover:opacity-0"} duration-(--fast) absolute transition-opacity`}
      />
      <props.solid
        className={`${props.active ? "opacity-100" : "opacity-0 group-hover:opacity-100"} duration-(--fast) absolute transition-opacity`}
      />
    </span>
  );
};

export default HoverIcon;
