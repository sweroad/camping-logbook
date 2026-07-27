/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { storeSharedFiles } from "./shareTargetDb";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache" }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/photos/"),
  new CacheFirst({ cacheName: "photo-cache" }),
);

async function handleShareTarget(request: Request): Promise<Response> {
  const formData = await request.formData();
  const files = formData.getAll("photos").filter((value): value is File => value instanceof File);
  const id = crypto.randomUUID();
  await storeSharedFiles(id, files);
  return Response.redirect(`/share-target?batch=${id}`, 303);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(event.request));
  }
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
