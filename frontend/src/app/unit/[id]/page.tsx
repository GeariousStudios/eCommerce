import { notFound } from "next/navigation";
import UnitWrapper from "../UnitWrapper";

export default function Page() {
  return <UnitWrapper />;
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
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
