import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderYamlToSvg } from "./renderer-core.js";
import { normalizeExportOptions, renderArtifact } from "./render-output.js";

export const DEFAULT_PORT = Number(process.env.PORT || 4173);
export const DEFAULT_HOST = "127.0.0.1";
export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

export function createServer({ root = ROOT } = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/render") {
      try {
        const body = await readJson(request);
        const yaml = String(body.yaml || "");
        if (!yaml.trim()) {
          throw new Error("Missing YAML");
        }
        const format = String(body.format || "svg").toLowerCase();
        const exportOptions = normalizeExportOptions({
          widthInches: body.widthInches,
          heightInches: body.heightInches,
          dpi: body.dpi,
          quality: body.quality,
          pageMarginPoints: body.pageMarginPoints,
        });
        const svg = renderYamlToSvg(yaml);
        const artifact = await renderArtifact(svg, format, exportOptions);
        response.writeHead(200, {
          "Content-Type": artifact.contentType,
          "Cache-Control": "no-store",
        });
        response.end(artifact.buffer);
      } catch (error) {
        response.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        response.end(JSON.stringify({ error: error.message || "Render failed" }));
      }
      return;
    }

    const pathname = decodeURIComponent(url.pathname === "/" ? "/public/index.html" : url.pathname);
    const filePath = path.join(root, pathname);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, contents) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(error.code === "ENOENT" ? "Not found" : "Server error");
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(contents);
    });
  });
}

export async function startServer({ port = DEFAULT_PORT, host = DEFAULT_HOST, root = ROOT } = {}) {
  const server = createServer({ root });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : port;
  const resolvedHost = typeof address === "object" && address ? address.address : host;
  return {
    server,
    host: resolvedHost,
    port: resolvedPort,
    url: `http://${resolvedHost}:${resolvedPort}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function isEntrypoint() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isEntrypoint()) {
  startServer()
    .then(({ url }) => {
      console.log(`TreeGen running at ${url}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
