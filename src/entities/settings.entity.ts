import {
  credentialSettingsKey,
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "simple-json", nullable: false })
  [serverSettingsKey]: {
    sentryDiagnosticsEnabled: boolean;
    loginRequired: boolean;
    registration: boolean;
    experimentalMoonrakerSupport: boolean;
    experimentalBambuSupport: boolean;
    experimentalPrusaLinkSupport: boolean;
  };

  @Column({ type: "simple-json", nullable: false })
  [credentialSettingsKey]: {
    jwtSecret: string;
    jwtExpiresIn: number;
    refreshTokenAttempts: number;
    refreshTokenExpiry: number;
  };

  @Column({ type: "simple-json", nullable: false })
  [wizardSettingKey]: {
    wizardCompleted: boolean;
    wizardCompletedAt: Date | null;
    wizardVersion: number;
  };

  @Column({ type: "simple-json", nullable: false })
  [frontendSettingKey]: {
    gridCols: number;
    gridRows: number;
    largeTiles: boolean;
    tilePreferCancelOverQuickStop: boolean;
    gridNameSortDirection?: 'horizontal' | 'vertical';
  };

  @Column({ type: "simple-json", nullable: false })
  [timeoutSettingKey]: {
    apiTimeout: number;
    apiUploadTimeout: number;
  };
}
