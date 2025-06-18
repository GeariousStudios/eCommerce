import { notFound } from "next/navigation";
import UnitWrapper from "../UnitWrapper";

type PageProps = {
  params: {
    id: string;
  };
};

export default function Page({ params }: PageProps) {
  return <UnitWrapper id={params.id} />;
}

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/unit`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();

  if (!data?.items) {
    notFound();
  }

  return data.items.map((unit: any) => ({
    id: unit.id.toString(),
  }));
}
