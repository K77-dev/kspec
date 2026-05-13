import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function confirm(question: string, defaultYes = false): Promise<boolean> {
  const suffix = defaultYes ? "(Y/n)" : "(y/N)";
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${question} ${suffix} `)).trim().toLowerCase();
    if (!answer) return defaultYes;
    return answer === "y" || answer === "yes" || answer === "s" || answer === "sim";
  } finally {
    rl.close();
  }
}

export async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(`${question} `)).trim();
  } finally {
    rl.close();
  }
}
