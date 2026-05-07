-- DropForeignKey
ALTER TABLE `match_imports` DROP FOREIGN KEY `match_imports_leagueId_fkey`;

-- DropForeignKey
ALTER TABLE `matches` DROP FOREIGN KEY `MatchV2_awayTeamId_fkey`;

-- DropForeignKey
ALTER TABLE `matches` DROP FOREIGN KEY `MatchV2_homeTeamId_fkey`;

-- DropForeignKey
ALTER TABLE `matches` DROP FOREIGN KEY `MatchV2_seasonId_fkey`;

-- DropForeignKey
ALTER TABLE `matches_legacy` DROP FOREIGN KEY `matches_awayTeamId_fkey`;

-- DropForeignKey
ALTER TABLE `matches_legacy` DROP FOREIGN KEY `matches_homeTeamId_fkey`;

-- DropForeignKey
ALTER TABLE `matches_legacy` DROP FOREIGN KEY `matches_leagueId_fkey`;

-- AlterTable
ALTER TABLE `match_imports` DROP COLUMN `leagueId`,
    ADD COLUMN `competitionId` VARCHAR(191) NOT NULL,
    ADD COLUMN `requestsUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `seasonId` VARCHAR(191) NULL,
    ADD COLUMN `syncMode` VARCHAR(191) NULL,
    MODIFY `fileName` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `leagues`;

-- DropTable
DROP TABLE `matches_legacy`;

-- CreateIndex
CREATE INDEX `match_imports_competitionId_idx` ON `match_imports`(`competitionId`);

-- CreateIndex
CREATE INDEX `match_imports_createdAt_idx` ON `match_imports`(`createdAt`);

-- AddForeignKey
ALTER TABLE `match_imports` ADD CONSTRAINT `match_imports_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `Competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_awayTeamId_idx` TO `matches_awayTeamId_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_dataSource_idx` TO `matches_dataSource_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_externalId_key` TO `matches_externalId_key`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_homeTeamId_idx` TO `matches_homeTeamId_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_seasonId_round_idx` TO `matches_seasonId_round_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_seasonId_utcDate_idx` TO `matches_seasonId_utcDate_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_status_idx` TO `matches_status_idx`;

-- RenameIndex
ALTER TABLE `matches` RENAME INDEX `MatchV2_utcDate_idx` TO `matches_utcDate_idx`;

