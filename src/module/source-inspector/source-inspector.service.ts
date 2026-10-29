import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { readdir, stat } from "node:fs/promises";
import { resolve, relative, sep, join } from "node:path";

interface SourceNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: SourceNode[];
}

@Injectable()
export class SourceInspectorService {
  private readonly sourceRoot = resolve(process.cwd());
  private readonly excludedDirectories = new Set([
    "node_modules",
    "dist",
    ".git",
    "coverage",
    ".next",
    ".turbo",
  ]);

  async getSourceTree(inputPath = "src") {
    const targetPath = resolve(this.sourceRoot, inputPath);
    const relativePath = relative(this.sourceRoot, targetPath);

    // Chặn truy cập ra ngoài project root.
    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`) ||
      resolve(targetPath) === this.sourceRoot + sep
    ) {
      throw new BadRequestException("Path is outside project root");
    }

    const info = await stat(targetPath).catch(() => null);

    if (!info?.isDirectory()) {
      throw new NotFoundException("Directory not found");
    }

    return {
      path: relativePath || ".",
      tree: await this.readDirectory(targetPath),
    };
  }

  private async readDirectory(directory: string): Promise<unknown[]> {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    const result: unknown[] = [];

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory() && this.excludedDirectories.has(entry.name)) {
        continue;
      }

      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        // Chỉ trả về thư mục, không đọc nội dung bên trong.
        result.push({
          name: entry.name,
          type: "directory",
        });
      } else if (entry.isFile()) {
        const fileStat = await stat(fullPath);

        result.push({
          name: entry.name,
          type: "file",
          size: fileStat.size,
        });
      }
    }

    return result;
  }
}
