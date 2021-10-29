import { PartialType } from "@nestjs/mapped-types";
import { CreateAlertDto } from "./create-monitoring.dto";

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}
