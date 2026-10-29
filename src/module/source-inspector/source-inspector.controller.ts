import { Controller, Get, Query } from "@nestjs/common";
import { SourceInspectorService } from "./source-inspector.service";
import { Public } from "../auth/decorator/public.decorator";

@Controller("source-inspector")
@Public()
export class SourceInspectorController {
  constructor(
    private readonly sourceInspectorService: SourceInspectorService,
  ) {}

  @Get("tree")
  getTree(@Query("path") path = "src"): Promise<any> {
    return this.sourceInspectorService.getSourceTree(path);
  }
}
