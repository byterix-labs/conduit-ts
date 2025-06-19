const glob = new Bun.Glob("dist/*").scan();
while (true) {
  const { done, value } = await glob.next();
  if (done) break;

  Bun.file(value).unlink();
}

await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "dist",
  target: "browser",
});

await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "dist",
  minify: true,
});
