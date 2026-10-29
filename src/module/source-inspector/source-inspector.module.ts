import { Module } from "@nestjs/common";
import { SourceInspectorController } from "./source-inspector.controller";
import { SourceInspectorService } from "./source-inspector.service";

@Module({
  controllers: [SourceInspectorController],
  providers: [SourceInspectorService],
})
export class SourceInspectorModule {}
