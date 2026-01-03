export class PrinterTagDto {
  printerId: number;
  tagId: number;
}

export class CreateTagDto {
  name: string;
  color?: string;
}
