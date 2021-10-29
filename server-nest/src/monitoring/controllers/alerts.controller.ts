import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CreateAlertDto } from "../dto/create-alert.dto";
import { UpdateAlertDto } from "../dto/update-alert.dto";
import { ApiTags } from "@nestjs/swagger";
import { AlertsService } from "../services/alerts.service";

@Controller("alerts")
@ApiTags(AlertsController.name)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() createMonitoringDto: CreateAlertDto) {
    return this.alertsService.create(createMonitoringDto);
  }

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.alertsService.findOne(+id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateMonitoringDto: UpdateAlertDto) {
    return this.alertsService.update(+id, updateMonitoringDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.alertsService.remove(+id);
  }
}
