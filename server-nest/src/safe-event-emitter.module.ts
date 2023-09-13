import { DynamicModule, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { EventEmitter2 } from "eventemitter2";
import { EventsMetadataAccessor } from "@nestjs/event-emitter/dist/events-metadata.accessor";
import { EventEmitterModuleOptions } from "@nestjs/event-emitter/dist/interfaces";
import { SafeEventSubscribersLoader } from "@/safe-event-subscribers.loader";

/**
 * Version pinned: @nestjs/event-emitter@1.3.1
 * Latest version 1.4.1 contains an iterable metadatas bug
 */
@Module({})
export class SafeEventEmitterModule {
  static forRoot(options?: EventEmitterModuleOptions): DynamicModule {
    return {
      global: options?.global ?? true,
      module: SafeEventEmitterModule,
      imports: [DiscoveryModule],
      providers: [
        SafeEventSubscribersLoader,
        EventsMetadataAccessor,
        {
          provide: EventEmitter2,
          useValue: new EventEmitter2(options)
        }
      ],
      exports: [EventEmitter2]
    };
  }
}
