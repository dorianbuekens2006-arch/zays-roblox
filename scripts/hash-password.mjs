import { randomBytes, scryptSync } from "node:crypto";

function readSecret(label) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Un terminal interactif est requis. Tu peux aussi passer le mot de passe comme argument."));
      return;
    }
    let value = "";
    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup(); process.stdout.write("\n"); reject(new Error("Annulé")); return;
        }
        if (character === "\r" || character === "\n") {
          cleanup(); process.stdout.write("\n"); resolve(value); return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value) { value = value.slice(0, -1); process.stdout.write("\b \b"); }
        } else if (character >= " ") {
          value += character; process.stdout.write("•");
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

let password = process.argv[2];
if (!password) {
  try {
    password = await readSecret("Mot de passe Admin : ");
    const confirmation = await readSecret("Confirme le mot de passe : ");
    if (password !== confirmation) throw new Error("Les mots de passe ne correspondent pas.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Impossible de lire le mot de passe.");
    process.exit(1);
  }
}

if (!password || password.length < 12) {
  console.error("Le mot de passe doit contenir au moins 12 caractères.");
  process.exit(1);
}

const salt = randomBytes(24);
const hash = scryptSync(password, salt, 64);
process.stdout.write(`scrypt$${salt.toString("hex")}$${hash.toString("hex")}\n`);
