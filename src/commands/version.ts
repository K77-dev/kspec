import chalk from "chalk";
import { getPackageVersion } from "../utils/paths.js";

export function runVersion(): void {
  console.log(chalk.bold(`kspec v${getPackageVersion()}`));
}
