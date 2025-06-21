import { createRouteHandler, createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "16MB" } }).onUploadComplete(() => {
    console.log("Upload complete");
  }),
};

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});