import * as fs from "fs";
import * as path from "path";
import { generateController } from "./templates/controller";
import { generateService } from "./templates/service";
import { generateModule } from "./templates/module";
import { generateEntity } from "./templates/entity";

// === UTILS ===
const moduleNames = process.argv.slice(2);

if (!moduleNames.length) {
  console.error(
    "❌ Vui lòng truyền tên module! VD: ts-node create-nest-module.ts user profile",
  );
  process.exit(1);
}

const capitalize = (str: string): string =>
  str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

const camelCase = (str: string): string => {
  const capitalized = capitalize(str);
  return capitalized.charAt(0).toLowerCase() + capitalized.slice(1);
};

const createModule = (moduleName: string) => {
  const className = capitalize(moduleName);
  const serviceName = camelCase(moduleName);

  const folderPath = path.join(__dirname, "..", "src", "module", moduleName);

  const dtoFolderPath = path.join(folderPath, "dto");
  const entitiesFolderPath = path.join(folderPath, "_entities");

  // === CHECK ===
  if (fs.existsSync(folderPath)) {
    console.error(`❌ Module "${moduleName}" đã tồn tại!`);
    return;
  }

  // === CREATE FOLDER ===
  fs.mkdirSync(folderPath, { recursive: true });
  fs.mkdirSync(dtoFolderPath, { recursive: true });
  fs.mkdirSync(entitiesFolderPath, { recursive: true });

  // === CREATE FILES ===
  fs.writeFileSync(
    path.join(folderPath, `${moduleName}.controller.ts`),
    generateController(moduleName, className, serviceName),
  );

  fs.writeFileSync(
    path.join(folderPath, `${moduleName}.service.ts`),
    generateService(moduleName, className),
  );

  fs.writeFileSync(
    path.join(folderPath, `${moduleName}.module.ts`),
    generateModule(moduleName, className),
  );

  fs.writeFileSync(
    path.join(entitiesFolderPath, `${moduleName}.entity.ts`),
    generateEntity(moduleName, className),
  );

  console.log(`✅ Created ${moduleName}`);
};

// === CREATE MULTIPLE ===
moduleNames.forEach(createModule);

console.log("🎉 Done!");
