import fs from "fs";

const dist = "./dist/index.html";
const output = "./dist/404.html";

fs.copyFile(dist, output, (err) => {
  if (err) {
    console.error("❌ Failed to copy 404.html:", err);
  } else {
    console.log("✅ 404.html created for GitHub Pages routing");
  }
});
