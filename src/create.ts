import inquirer from "inquirer";
import fs from "fs";
import download from "download-git-repo";
import path from "path";
import { Templates } from "./config";
import { exec } from "child_process";
import { runCommand } from "./util";

export async function createProject(projectPath: string) {
  // 校验项目名称是否合法
  if (!isValidProjectPath(projectPath)) {
    console.error("不合法的项目路径，只允许使用字母、数字、中划线和下划线。");
    process.exit(1);
  }
  const projectName = path.basename(projectPath);
  const destPath = path.resolve(process.cwd(), projectPath);
  // 检查目标路径是否存在
  if (fs.existsSync(destPath)) {
    // 如果目标路径已存在，检查是否为空目录
    const isEmpty = await isDirectoryEmpty(destPath);
    if (!isEmpty) {
      // 如果目录不为空，向用户询问是否覆盖
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `目录【${projectName}】不是一个空目录，你需要覆盖它吗？`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log("Operation canceled.");
        return;
      }
      fs.rmSync(destPath, { recursive: true });
    }
  }
  fs.mkdirSync(destPath, { recursive: true });

  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "选择项目模板",
      choices: Templates.map((v) => v.name),
    },
  ]);
  const selectedTemplate = Templates.find((v) => v.name === template);
  if (!selectedTemplate) {
    console.error("Invalid template selected.");
    process.exit(1);
  }

  try {
    console.log(`正在下载项目模板...`);
    await downloadTemplate(selectedTemplate.url, destPath);
    // 进入项目目录并安装依赖
    console.log("正在安装依赖...");
    process.chdir(destPath);
    await runCommand("npm", ["install"]);
    process.chdir(process.cwd());
    console.log(`项目创建成功！`);
    console.log(`请输入 cd ${projectPath} 进入项目`);
  } catch (err) {
    console.error("项目创建失败", err);
    fs.rmSync(destPath, { recursive: true });
    process.exit(1);
  }
}

// 校验项目路径是否合法
function isValidProjectPath(path: string): boolean {
  const invalidChars = /[<>:"|?*\x00-\x1F]/g; // 禁止的字符，不包括斜杠和反斜杠
  return !invalidChars.test(path) && path.length > 0;
}

// 是够为空目录
async function isDirectoryEmpty(dir: string): Promise<boolean> {
  const files = await fs.promises.readdir(dir);
  return files.length === 0;
}

// 下载模板
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
