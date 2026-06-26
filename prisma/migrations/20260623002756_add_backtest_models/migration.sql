-- CreateTable
CREATE TABLE `league_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `utcDate` DATETIME(3) NOT NULL,
    `muH` DOUBLE NOT NULL,
    `muA` DOUBLE NOT NULL,
    `varH` DOUBLE NOT NULL,
    `varA` DOUBLE NOT NULL,
    `piH` DOUBLE NOT NULL,
    `piA` DOUBLE NOT NULL,
    `rho` DOUBLE NOT NULL,
    `totalJogos` INTEGER NOT NULL,
    `muH_xg` DOUBLE NULL,
    `muA_xg` DOUBLE NULL,

    UNIQUE INDEX `league_snapshots_matchId_key`(`matchId`),
    INDEX `league_snapshots_competitionId_seasonId_utcDate_idx`(`competitionId`, `seasonId`, `utcDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_team_stats` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `side` ENUM('HOME', 'AWAY') NOT NULL,
    `window` INTEGER NULL,
    `avgGoalsScored` DOUBLE NULL,
    `avgGoalsConceded` DOUBLE NULL,
    `cvGoals` DOUBLE NULL,
    `avgCorners` DOUBLE NULL,
    `avgShots` DOUBLE NULL,
    `avgShotsOnTarget` DOUBLE NULL,
    `xg` DOUBLE NULL,
    `passAccuracy` DOUBLE NULL,

    INDEX `match_team_stats_side_window_idx`(`side`, `window`),
    UNIQUE INDEX `match_team_stats_matchId_teamId_window_key`(`matchId`, `teamId`, `window`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_backtests` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filters` JSON NOT NULL,
    `resultMeta` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_backtests_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `league_snapshots` ADD CONSTRAINT `league_snapshots_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `Competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `league_snapshots` ADD CONSTRAINT `league_snapshots_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `league_snapshots` ADD CONSTRAINT `league_snapshots_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_team_stats` ADD CONSTRAINT `match_team_stats_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_team_stats` ADD CONSTRAINT `match_team_stats_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_backtests` ADD CONSTRAINT `saved_backtests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
