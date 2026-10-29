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

  private async readDirectory(directory: string): Promise<SourceNode[]> {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    const nodes: SourceNode[] = [];

    for (const entry of entries) {
      // Không đi theo symbolic link để tránh truy cập ngoài source.
      if (entry.isSymbolicLink()) {
        continue;
      }

      const absolutePath = join(directory, entry.name);
      const relativePath = relative(process.cwd(), absolutePath);

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "directory",
          children: await this.readDirectory(absolutePath),
        });
      } else if (entry.isFile()) {
        const fileStat = await stat(absolutePath);

        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "file",
          size: fileStat.size,
        });
      }
    }

    return nodes;
  }
}
