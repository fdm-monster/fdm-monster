import { Provider } from "@nestjs/common";
import { AuthConfig } from "@/auth/auth.config";
import { JwtOptions } from "@/auth/interfaces/jwt-options.model";
import { CoreTestModule } from "./core-test.module";

export const TestProviders: Provider<any>[] = [
  CoreTestModule,
  {
    provide: AuthConfig.KEY,
    useValue: {
      secret: "TotallySafeTest",
      expiresIn: 120
    } as JwtOptions
  }
];
