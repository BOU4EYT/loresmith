"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function SortSelect({ current }: { current?: string }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "relevance") {
      params.delete("sort");
    } else {
      params.set("sort", e.target.value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select className="fsel" value={current ?? "relevance"} onChange={handleChange}>
      <option value="relevance">SORT: RELEVANCE</option>
      <option value="score">SORT: RATING</option>
      <option value="price_asc">SORT: PRICE ↑</option>
    </select>
  );
}
