import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../../.."));
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const filePath = resolveFilePath(url.pathname);

  if (!filePath || !filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`DreamScope frontend test server running at http://127.0.0.1:${port}`);
});

function resolveFilePath(pathname) {
  const routePath = pathname.replace(/\/$/, "");

  if (!routePath || routePath === "/") {
    return join(root, "index.html");
  }

  if (routePath === "/login") {
    return join(root, "login", "index.html");
  }

  if (routePath === "/dreams") {
    return join(root, "dreams", "index.html");
  }

  if (routePath === "/settings") {
    return join(root, "settings", "index.html");
  }

  return join(root, decodeURIComponent(pathname.slice(1)));
}
