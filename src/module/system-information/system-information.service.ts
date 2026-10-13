import { Injectable } from "@nestjs/common";
import * as os from "node:os";
import * as process from "node:process";
import si from "systeminformation";

@Injectable()
export class SystemInformationService {
  async getMetrics() {
    const [cpuLoad, memory, filesystem] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    const processMemory = process.memoryUsage();

    return {
      os: {
        platform: os.platform(),
        uptimeSeconds: os.uptime(),
        cpuCores: os.cpus().length,
      },
      cpu: {
        usagePercent: cpuLoad.currentLoad,
      },
      memory: {
        totalBytes: memory.total,
        usedBytes: memory.used,
        freeBytes: memory.available,
        processRssBytes: processMemory.rss,
        heapUsedBytes: processMemory.heapUsed,
      },
      disks: filesystem.map((disk) => ({
        filesystem: disk.fs,
        mount: disk.mount,
        totalBytes: disk.size,
        usedBytes: disk.used,
        usagePercent: disk.use,
      })),
    };
  }
}
