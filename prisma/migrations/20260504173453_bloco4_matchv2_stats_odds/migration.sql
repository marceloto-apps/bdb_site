-- AlterTable
ALTER TABLE `teams` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `MatchV2` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `homeTeamId` VARCHAR(191) NOT NULL,
    `awayTeamId` VARCHAR(191) NOT NULL,
    `round` INTEGER NULL,
    `status` ENUM('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `utcDate` DATETIME(3) NOT NULL,
    `fthg` INTEGER NULL,
    `ftag` INTEGER NULL,
    `ftr` ENUM('H', 'D', 'A') NULL,
    `venueName` VARCHAR(191) NULL,
    `venueCity` VARCHAR(191) NULL,
    `refereeName` VARCHAR(191) NULL,
    `xgAvailable` BOOLEAN NOT NULL DEFAULT false,
    `oddsAvailable` BOOLEAN NOT NULL DEFAULT false,
    `dataSource` ENUM('THESTATSAPI', 'FOOTBALL_DATA', 'MANUAL') NOT NULL DEFAULT 'THESTATSAPI',
    `sourceFile` VARCHAR(191) NULL,
    `syncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MatchV2_externalId_key`(`externalId`),
    INDEX `MatchV2_seasonId_utcDate_idx`(`seasonId`, `utcDate`),
    INDEX `MatchV2_seasonId_round_idx`(`seasonId`, `round`),
    INDEX `MatchV2_homeTeamId_idx`(`homeTeamId`),
    INDEX `MatchV2_awayTeamId_idx`(`awayTeamId`),
    INDEX `MatchV2_utcDate_idx`(`utcDate`),
    INDEX `MatchV2_status_idx`(`status`),
    INDEX `MatchV2_dataSource_idx`(`dataSource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchStats` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `homeXg` DOUBLE NULL,
    `awayXg` DOUBLE NULL,
    `homeXgFirstHalf` DOUBLE NULL,
    `awayXgFirstHalf` DOUBLE NULL,
    `homeXgSecondHalf` DOUBLE NULL,
    `awayXgSecondHalf` DOUBLE NULL,
    `homePossession` DOUBLE NULL,
    `awayPossession` DOUBLE NULL,
    `homeShots` INTEGER NULL,
    `awayShots` INTEGER NULL,
    `homeShotsOnTarget` INTEGER NULL,
    `awayShotsOnTarget` INTEGER NULL,
    `homeShotsOffTarget` INTEGER NULL,
    `awayShotsOffTarget` INTEGER NULL,
    `homeShotsBlocked` INTEGER NULL,
    `awayShotsBlocked` INTEGER NULL,
    `homeCorners` INTEGER NULL,
    `awayCorners` INTEGER NULL,
    `homeCrosses` INTEGER NULL,
    `awayCrosses` INTEGER NULL,
    `homeDribbles` INTEGER NULL,
    `awayDribbles` INTEGER NULL,
    `homePassesTotal` INTEGER NULL,
    `awayPassesTotal` INTEGER NULL,
    `homePassesAccurate` INTEGER NULL,
    `awayPassesAccurate` INTEGER NULL,
    `homeDuelsTotal` INTEGER NULL,
    `awayDuelsTotal` INTEGER NULL,
    `homeDuelsWon` INTEGER NULL,
    `awayDuelsWon` INTEGER NULL,
    `homeClearances` INTEGER NULL,
    `awayClearances` INTEGER NULL,
    `homeInterceptions` INTEGER NULL,
    `awayInterceptions` INTEGER NULL,
    `homeTackles` INTEGER NULL,
    `awayTackles` INTEGER NULL,
    `homeSaves` INTEGER NULL,
    `awaySaves` INTEGER NULL,
    `homeFouls` INTEGER NULL,
    `awayFouls` INTEGER NULL,
    `homeYellowCards` INTEGER NULL,
    `awayYellowCards` INTEGER NULL,
    `homeRedCards` INTEGER NULL,
    `awayRedCards` INTEGER NULL,
    `homeOffsides` INTEGER NULL,
    `awayOffsides` INTEGER NULL,
    `syncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MatchStats_matchId_key`(`matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchOdds` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `bookmakerId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `selection` VARCHAR(191) NOT NULL,
    `line` DOUBLE NULL,
    `oddsType` ENUM('PREMATCH_OPENING', 'PREMATCH_CLOSING') NOT NULL,
    `odds` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MatchOdds_matchId_idx`(`matchId`),
    INDEX `MatchOdds_bookmakerId_idx`(`bookmakerId`),
    INDEX `MatchOdds_marketId_idx`(`marketId`),
    INDEX `MatchOdds_matchId_bookmakerId_idx`(`matchId`, `bookmakerId`),
    INDEX `MatchOdds_matchId_marketId_idx`(`matchId`, `marketId`),
    UNIQUE INDEX `MatchOdds_matchId_bookmakerId_marketId_selection_line_oddsTy_key`(`matchId`, `bookmakerId`, `marketId`, `selection`, `line`, `oddsType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MatchV2` ADD CONSTRAINT `MatchV2_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchV2` ADD CONSTRAINT `MatchV2_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchV2` ADD CONSTRAINT `MatchV2_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchStats` ADD CONSTRAINT `MatchStats_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `MatchV2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchOdds` ADD CONSTRAINT `MatchOdds_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `MatchV2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchOdds` ADD CONSTRAINT `MatchOdds_bookmakerId_fkey` FOREIGN KEY (`bookmakerId`) REFERENCES `Bookmaker`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchOdds` ADD CONSTRAINT `MatchOdds_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
