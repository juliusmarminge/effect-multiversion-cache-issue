export const dynamic = "force-dynamic";

const resolveUrl = (path: string) => {
  const vercel = process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
    ? `https://${process.env.VERCEL_PROJECT_PREVIEW_URL}`
    : undefined;

  const base = vercel || "http://localhost:3000";
  return `${base}${path}`;
};

export default async function Home() {
  const data = await (await fetch(resolveUrl("/api/uploadthing"))).json();

  return (
    <div>
      <h1>Hello Next.js</h1>
      <pre>
        <code>{JSON.stringify(data, null, 4)}</code>
      </pre>
    </div>
  );
}
