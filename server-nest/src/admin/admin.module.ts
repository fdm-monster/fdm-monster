import { Module } from "@nestjs/common";
import { AdminController } from "@/admin/admin.controller";
import { AdminGateway } from "@/admin/admin.gateway";

@Module({
  controllers: [AdminController],
  providers: [AdminGateway],
})
export class AdminModule {}
