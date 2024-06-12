import { Command } from "commander";
import { createProject } from "./create";

export function main() {
  const program = new Command();
  const packageJson = require("../package.json");
  console.log("版本: ", packageJson.version);

  program
    .name("cocos-cli")
    .description(packageJson.description)
    .version(packageJson.version);

  program
    .command("create <project-path>")
    .description("create a new cocos project")
    .action(async (projectPath: string) => {
      await createProject(projectPath);
    });

  program.parse(process.argv);
}
