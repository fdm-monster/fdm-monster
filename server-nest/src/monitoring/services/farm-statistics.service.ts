import { Injectable } from "@nestjs/common";
import { CreateAlertDto } from "../dto/create-alert.dto";
import { UpdateAlertDto } from "../dto/update-alert.dto";

@Injectable()
export class FarmStatisticsService {
  create(createMonitoringDto: CreateAlertDto) {
    return "This action adds a new monitoring";
  }

  findAll() {
    return `This action returns all monitoring`;
  }

  findOne(id: number) {
    return `This action returns a #${id} monitoring`;
  }

  update(id: number, updateMonitoringDto: UpdateAlertDto) {
    return `This action updates a #${id} monitoring`;
  }

  remove(id: number) {
    return `This action removes a #${id} monitoring`;
  }
}
