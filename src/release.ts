import { execSync } from "child_process";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";

// 获取 package.json 的路径
const packageJsonPath = path.resolve(__dirname, "../package.json");

// 读取 package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const currentVersion = packageJson.version;

// 解析版本号
const [major, minor, patch] = currentVersion.split(".").map(Number);

// 生成新版本号
const newVersionChoices = [
  `${major}.${minor}.${patch + 1}`, // 次版本号+1
  `${major}.${minor + 1}.0`, // 小版本号+1
  `${major + 1}.0.0`, // 大版本号+1
];

async function main() {
  try {
    // 执行 npm run build
    console.log("正在执行 npm run build...");
    execSync("npm run build", { stdio: "inherit" });

    // 询问用户选择新版本号
    const { newVersion } = await inquirer.prompt([
      {
        type: "list",
        name: "newVersion",
        message: "选择新版本号",
        choices: newVersionChoices,
      },
    ]);

    // 更新 package.json 中的版本号
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // 提交更改并创建新标签
    console.log("正在提交更改并创建新标签...");
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "release: v${newVersion}"`, { stdio: "inherit" });
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    execSync("git push --follow-tags", { stdio: "inherit" });

    // 发布新版本
    console.log("正在发布新版本...");
    execSync("");
    execSync("npm publish --registry https://registry.npmjs.org/", {
      stdio: "inherit",
    });

    console.log(`发布成功: v${newVersion}`);
  } catch (error) {
    console.error("发布失败", error);
    process.exit(1);
  }
}

main();
