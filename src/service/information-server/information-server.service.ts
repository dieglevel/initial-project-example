import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "src/common/environment/types/app.config";
import { databaseConfig } from "src/common/environment/types/database.type";

@Injectable()
export class InformationServerLogService implements OnApplicationBootstrap {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,

    @Inject(databaseConfig.KEY)
    private readonly database: ConfigType<typeof databaseConfig>,
  ) {}

  onApplicationBootstrap() {
    this.print();
  }

  print() {
    const { HOST: hostname, PORT: port, NODE_ENV: env } = this.config;
    const { POSTGRES_DB: database, DATABASE_DROP_SCHEMA: dropSchema } =
      this.database;

    const green = "\x1b[32m";
    const cyan = "\x1b[36m";
    const reset = "\x1b[0m";
    const bold = "\x1b[1m";
    const red = "\x1b[31m";
    const yellow = "\x1b[33m";
    const gray = "\x1b[90m";

    const labelWidth = 20;

    const title = `${bold}${green}📢 Server Information${reset}`;

    const lines: [string, string, string][] = [
      ["🌍", `Hostname:`, `${cyan}${hostname}${reset}`],
      ["🟢", `Port:`, `${cyan}${port}${reset}`],
      ["🚨", `Env:`, `${cyan}${bold}${env}${reset}`],
      ["📄", `Swagger:`, `${cyan}http://${hostname}:${port}/api${reset}`],
      ["🗄️", ` Database:`, ` ${cyan}${bold}${database}${reset}`],
      [
        "🗑️",
        ` Drop Schema:`,
        ` ${dropSchema ? `${red}${bold}Yes` : `${green}${bold}No`}${reset}`,
      ],
    ];

    // Tính độ dài lớn nhất (bỏ escape code khi tính độ dài)
    // eslint-disable-next-line no-control-regex
    const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, "");
    const contentWidth = Math.max(
      ...lines.map(
        ([icon, label, value]) =>
          stripAnsi(`${icon} ${label.padEnd(labelWidth)} ${value}`).length,
      ),
      stripAnsi(title).length,
    );
    const boxWidth = contentWidth + 4;

    const drawLine = (left: string, mid: string, right: string) =>
      `${green}${left}${mid.repeat(boxWidth - 2)}${right}${reset}`;

    const printCenter = (text: string) => {
      const stripped = stripAnsi(text);
      const padding = contentWidth - stripped.length;
      const leftPad = Math.floor(padding / 2);
      const rightPad = Math.ceil(padding / 2);
      return ` ${" ".repeat(leftPad)}${text}${" ".repeat(rightPad)} `;
    };

    console.log(drawLine("╭", "─", "╮"));
    console.log(printCenter(title));
    console.log(drawLine("├", "─", "┤"));

    lines.forEach(([icon, label, value]) => {
      const rawLine = `${icon} ${label.padEnd(labelWidth)} ${value}`;
      const visibleLength = stripAnsi(rawLine).length;
      const padding = " ".repeat(contentWidth - visibleLength);
      console.log(` ${rawLine}${padding} `);
    });

    console.log(drawLine("╰", "─", "╯"));
  }
}
