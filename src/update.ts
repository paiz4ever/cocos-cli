import inquirer from "inquirer";
import fs from "fs";
import download from "download-git-repo";
import path from "path";
import { Templates } from "./config";
import { runCommand } from "./util";

const updateDirs = ["extensions", "tables/luban"];
const updateFiles = ["gen.bat", "gen.sh"];

export async function updateProject(projectPath: string) {
  const destPath = path.resolve(process.cwd(), projectPath);

  // 检查目标路径是否存在
  if (!fs.existsSync(destPath)) {
    console.error("指定的项目路径不存在。");
    process.exit(1);
  }

  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "选择更新模板",
      choices: Templates.map((v) => v.name),
    },
  ]);
  const selectedTemplate = Templates.find((v) => v.name === template);
  if (!selectedTemplate) {
    console.error("Invalid template selected.");
    process.exit(1);
  }

  try {
    const tempDir = path.join(destPath, "__temp_update");
    fs.mkdirSync(tempDir, { recursive: true });

    console.log(`正在下载更新模板...`);
    await downloadTemplate(selectedTemplate.url, tempDir);

    // 仅替换指定的目录和文件
    for (const dir of updateDirs) {
      const tempDirPath = path.join(tempDir, dir);
      const destDirPath = path.join(destPath, dir);
      if (fs.existsSync(tempDirPath)) {
        if (fs.existsSync(destDirPath)) {
          fs.rmSync(destDirPath, { recursive: true });
        }
        fs.renameSync(tempDirPath, destDirPath);
      }
    }

    for (const file of updateFiles) {
      const tempFilePath = path.join(tempDir, file);
      const destFilePath = path.join(destPath, file);
      if (fs.existsSync(tempFilePath)) {
        if (fs.existsSync(destFilePath)) {
          fs.rmSync(destFilePath, { force: true });
        }
        fs.renameSync(tempFilePath, destFilePath);
      }
    }

    // 删除临时目录
    fs.rmSync(tempDir, { recursive: true });

    // 安装依赖
    console.log("正在安装依赖...");
    await runCommand("npm", ["install"], { cwd: destPath });

    // 根据操作系统执行脚本
    const script = process.platform === "win32" ? "gen.bat" : "gen.sh";
    const command = process.platform === "win32" ? script : "sh";
    const args = process.platform === "win32" ? [] : [script];

    await runCommand(command, args, { cwd: destPath });

    console.log("框架目录更新成功！");
  } catch (err) {
    console.error("更新失败", err);
    process.exit(1);
  }
}

function downloadTemplate(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    download(url, dest, { clone: false }, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(void 0);
      }
    });
  });
}
