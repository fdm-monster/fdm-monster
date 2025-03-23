import { LoginDto } from "@/services/interfaces/login.dto";

export interface ISocketLogin {
  printerId: string;
  loginDto: LoginDto;
}
