import UnitClient from "../UnitClient";
import { notFound } from "next/navigation";
import UnitWrapper from "../UnitWrapper";

type Props = {
  params: {
    id: string;
  };
};

const UnitPage = (props: Props) => {
  return <UnitWrapper id={props.params.id} />;
};

export default UnitPage;

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/unit`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();

  if (!data) {
    notFound();
  }

  return data.items.map((unit: any) => ({
    id: unit.id.toString(),
  }));
}
