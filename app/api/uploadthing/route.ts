import { imaginaryAsyncDbClient } from "@/app/db";
import { createRouteHandler, createUploadthing } from "uploadthing/next";

const f = createUploadthing();

const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "16MB" } }).onUploadComplete(
    async ({ file }) => {
      await imaginaryAsyncDbClient.set("image", file.url);
      console.log("Upload complete and inserted to db");
    }
  ),
};

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
