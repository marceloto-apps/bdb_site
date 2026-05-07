-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_leagueId_fkey`;

-- DropIndex
DROP INDEX `teams_externalId_leagueId_key` ON `teams`;

-- DropIndex
DROP INDEX `teams_name_leagueId_key` ON `teams`;

-- AlterTable
ALTER TABLE `teams` DROP COLUMN `leagueId`,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `stadiumCapacity` INTEGER NULL,
    ADD COLUMN `stadiumCity` VARCHAR(191) NULL,
    ADD COLUMN `stadiumName` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `externalId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TeamAlias` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(191) NOT NULL,
    `source` ENUM('THESTATSAPI', 'FOOTBALL_DATA', 'MANUAL') NOT NULL,

    INDEX `TeamAlias_teamId_idx`(`teamId`),
    INDEX `TeamAlias_alias_idx`(`alias`),
    UNIQUE INDEX `TeamAlias_alias_source_key`(`alias`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamSeason` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `matchesPlayed` INTEGER NULL,
    `wins` INTEGER NULL,
    `draws` INTEGER NULL,
    `losses` INTEGER NULL,
    `points` INTEGER NULL,
    `position` INTEGER NULL,
    `goalsFor` INTEGER NULL,
    `goalsAgainst` INTEGER NULL,
    `goalDifference` INTEGER NULL,
    `form` VARCHAR(191) NULL,
    `syncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamSeason_seasonId_idx`(`seasonId`),
    INDEX `TeamSeason_teamId_idx`(`teamId`),
    INDEX `TeamSeason_position_idx`(`position`),
    UNIQUE INDEX `TeamSeason_teamId_seasonId_key`(`teamId`, `seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `teams_externalId_key` ON `teams`(`externalId`);

-- CreateIndex
CREATE INDEX `teams_country_idx` ON `teams`(`country`);

-- AddForeignKey
ALTER TABLE `TeamAlias` ADD CONSTRAINT `TeamAlias_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamSeason` ADD CONSTRAINT `TeamSeason_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamSeason` ADD CONSTRAINT `TeamSeason_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
