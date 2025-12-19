import {
  credentialSettingsKey,
  frontendSettingKey,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ISettings } from "@/models/Settings";

@Entity()
export class Settings implements ISettings<number> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "simple-json", nullable: false })
  [serverSettingsKey]: {
    sentryDiagnosticsEnabled: boolean;
    loginRequired: boolean;
    registration: boolean;
    experimentalMoonrakerSupport: boolean;
    experimentalClientSupport: boolean;
    experimentalBambuSupport: boolean;
    experimentalThumbnailSupport: boolean;
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
  [printerFileCleanSettingKey]: {
    autoRemoveOldFilesBeforeUpload: boolean;
    autoRemoveOldFilesAtBoot: boolean;
    autoRemoveOldFilesCriteriumDays: number;
  };

  @Column({ type: "simple-json", nullable: false })
  [frontendSettingKey]: {
    gridCols: number;
    gridRows: number;
    largeTiles: boolean;
    tilePreferCancelOverQuickStop: boolean;
  };

  @Column({ type: "simple-json", nullable: false })
  [timeoutSettingKey]: {
    apiTimeout: number;
    apiUploadTimeout: number;
  };
}
