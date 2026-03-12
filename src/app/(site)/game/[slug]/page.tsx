export default function GamePage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <h1>Game: {params.slug}</h1>
      <p>Coming soon.</p>
    </div>
  );
}
