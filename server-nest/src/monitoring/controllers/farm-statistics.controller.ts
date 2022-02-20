import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CreateAlertDto } from "../dto/create-alert.dto";
import { UpdateAlertDto } from "../dto/update-alert.dto";
import { ApiTags } from "@nestjs/swagger";
import { FarmStatisticsService } from "../services/farm-statistics.service";

@Controller("farm-statistics")
@ApiTags(FarmStatisticsController.name)
export class FarmStatisticsController {
  constructor(private readonly farmStatisticsService: FarmStatisticsService) {}

  @Post()
  create(@Body() createMonitoringDto: CreateAlertDto) {
    return this.farmStatisticsService.create(createMonitoringDto);
  }

  @Get()
  findAll() {
    return this.farmStatisticsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.farmStatisticsService.findOne(+id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateMonitoringDto: UpdateAlertDto) {
    return this.farmStatisticsService.update(+id, updateMonitoringDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.farmStatisticsService.remove(+id);
  }
}
