import * as fs from "fs";
import * as path from "path";
import { generateController } from "./templates/controller";
import { generateService } from "./templates/service";
import { generateModule } from "./templates/module";

// === UTILS ===
const moduleName = process.argv[2];

if (!moduleName) {
  console.error(
    "❌ Vui lòng truyền tên module! VD: ts-node create-nest-module.ts to-do",
  );
  process.exit(1);
}

// Example: hello-world -> HelloWorld
const capitalize = (str: string): string =>
  str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

const camelCase = (str: string): string => {
  const capitalized = capitalize(str);
  return capitalized.charAt(0).toLowerCase() + capitalized.slice(1);
};

const className = capitalize(moduleName); // ToDo, UserProfile...
const serviceName = camelCase(moduleName); // toDo
const folderPath = path.join(__dirname, "..", "src", "module", moduleName);
const dtoFolderPath = path.join(folderPath, "dto");
const entitiesFolderPath = path.join(folderPath, "_entities");

// === CHECK + CREATE FOLDERS ===
if (fs.existsSync(folderPath)) {
  console.error("❌ Module đã tồn tại!");
  process.exit(1);
}
fs.mkdirSync(folderPath, { recursive: true });
fs.mkdirSync(dtoFolderPath, { recursive: true });
fs.mkdirSync(entitiesFolderPath, { recursive: true });

fs.writeFileSync(
  path.join(folderPath, `${moduleName}.controller.ts`),
  generateController(moduleName, className, serviceName),
);
fs.writeFileSync(
  path.join(folderPath, `${moduleName}.service.ts`),
  generateService(className),
);
fs.writeFileSync(
  path.join(folderPath, `${moduleName}.module.ts`),
  generateModule(moduleName, className),
);

// fs.writeFileSync(
//   path.join(dtoFolderPath, "request.dto.ts"),
//   generateRequestDto(className),
// );
// fs.writeFileSync(
//   path.join(dtoFolderPath, "response.dto.ts"),
//   generateResponseDto(className),
// );

// fs.writeFileSync(path.join(dtoFolderPath, "base.dto.ts"), generateBaseDto());

console.log(`✅ Đã tạo module "${moduleName}" tại ${folderPath}`);
