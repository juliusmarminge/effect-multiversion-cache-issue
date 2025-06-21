import { ChatTest } from "./chat";
import { imaginaryAsyncDbClient } from "./db";

export const dynamic = "force-dynamic";

const resolveUrl = (path: string) => {
  const vercel =
    process.env.VERCEL_ENV === "production"
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : undefined;

  const base = vercel || "http://localhost:3000";
  return `${base}${path}`;
};

export default async function Home() {
  const data = await (await fetch(resolveUrl("/api/uploadthing")))
    .json()
    .catch((error) => {
      console.error(error);
      return null;
    });

  const dbData = await imaginaryAsyncDbClient.get("image");

  return (
    <div>
      <h1>Hello Next.js</h1>
      <pre>
        <code>{JSON.stringify(data, null, 4)}</code>
      </pre>
      <pre>
        <code>{JSON.stringify(dbData, null, 4)}</code>
      </pre>
      <ChatTest />
    </div>
  );
}
