import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const appDirectory = path.resolve("app");
const routes = new Map();

async function walk(directory, segments = []) {
  const files = await readdir(directory, { withFileTypes: true });
  if (files.some((file) => file.isFile() && /^page\.(tsx?|jsx?)$/.test(file.name))) {
    const pathname = "/" + segments.join("/");
    const isDynamic = segments.some((segment) => segment.startsWith(":"));
    const route = {
      path: pathname,
      ...(!isDynamic ? { title: segments.length ? segments.at(-1).replace(/[-_:]/g, " ") : "IT Club" } : {}),
    };
    routes.set(pathname, route);
  }
  for (const file of files) {
    if (!file.isDirectory() || file.name.startsWith("_") || file.name.startsWith("@") || file.name === "api") continue;
    if (file.name.startsWith("(")) {
      await walk(path.join(directory, file.name), segments);
      continue;
    }
    let segment = file.name;
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) segment = ":" + segment.slice(5, -2) + "*";
    else if (/^\[\.\.\..+\]$/.test(segment)) segment = ":" + segment.slice(4, -1) + "*";
    else if (/^\[.+\]$/.test(segment)) segment = ":" + segment.slice(1, -1);
    await walk(path.join(directory, file.name), [...segments, segment]);
  }
}

await walk(appDirectory);
await writeFile("public/manus-routes.json", JSON.stringify({ routes: [...routes.values()].sort((a, b) => a.path.localeCompare(b.path)) }, null, 2) + "\n");
console.log(`Declared ${routes.size} page routes from current App Router source.`);
