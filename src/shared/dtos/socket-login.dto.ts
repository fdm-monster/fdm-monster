import { LoginDto } from "@/services/interfaces/login.dto";

export interface ISocketLogin {
  printerId: number;
  loginDto: LoginDto;
}
