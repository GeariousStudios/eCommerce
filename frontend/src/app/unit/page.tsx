import UnitWrapper from "./UnitWrapper";

type Props = {
  params: {
    id: string;
  };
};

const Unit = (props: Props) => {
  return <UnitWrapper id={props.params.id} />;
};

export default Unit;
