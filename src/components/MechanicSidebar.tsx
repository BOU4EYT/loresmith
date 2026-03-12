import Link from "next/link";

type Mechanic = {
  slug: string;
  label: string;
};

export function MechanicSidebar({
  mechanics,
  active,
}: {
  mechanics: Mechanic[];
  active?: string;
}) {
  return (
    <aside className="w-64 border-r border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold">Mechanics</h2>
      <ul className="space-y-2 text-sm">
        <li>
          <Link href="/" className={!active ? "font-semibold" : "text-gray-600"}>
            All
          </Link>
        </li>
        {mechanics.map((mechanic) => (
          <li key={mechanic.slug}>
            <Link
              href={`/?mechanic=${encodeURIComponent(mechanic.slug)}`}
              className={
                active === mechanic.slug ? "font-semibold" : "text-gray-600"
              }
            >
              {mechanic.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
