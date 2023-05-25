import { SchedulerMetadataAccessor } from "@nestjs/schedule/dist/schedule-metadata.accessor";
import { DiscoveryModule } from "@nestjs/core";
import { SchedulerRegistry } from "@nestjs/schedule";
import { DynamicModule, Module } from "@nestjs/common";
import { SafeSchedulerRegistry } from "@/utils/safe-scheduler/safe-scheduler.registry";
import { SafeScheduleExplorer } from "@/utils/safe-scheduler/safe-schedule.explorer";
import { ScheduleExplorer } from "@nestjs/schedule/dist/schedule.explorer";
import { SchedulerOrchestrator } from "@nestjs/schedule/dist/scheduler.orchestrator";

/*
 * Pinned to @nests/schedule@2.2.0
 */
@Module({
  imports: [DiscoveryModule],
  providers: [SchedulerMetadataAccessor, SchedulerOrchestrator],
})
export class SafeScheduleModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: SafeScheduleModule,
      providers: [
        { provide: ScheduleExplorer, useClass: SafeScheduleExplorer },
        { provide: SchedulerRegistry, useClass: SafeSchedulerRegistry },
      ],
      exports: [SchedulerRegistry],
    };
  }
}
