import { spawn } from "child_process";

export function runCommand(
  command: string,
  args: string[],
  options = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    child.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}
