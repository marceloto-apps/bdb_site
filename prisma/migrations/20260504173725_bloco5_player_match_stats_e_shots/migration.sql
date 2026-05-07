-- CreateTable
CREATE TABLE `PlayerMatchStats` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `rating` DOUBLE NULL,
    `minutesPlayed` INTEGER NULL,
    `started` BOOLEAN NOT NULL DEFAULT false,
    `played` BOOLEAN NOT NULL DEFAULT false,
    `passesTotal` INTEGER NULL,
    `passesAccurate` INTEGER NULL,
    `keyPasses` INTEGER NULL,
    `shotsTotal` INTEGER NULL,
    `shotsOnTarget` INTEGER NULL,
    `goals` INTEGER NULL,
    `expectedGoals` DOUBLE NULL,
    `duelsTotal` INTEGER NULL,
    `duelsWon` INTEGER NULL,
    `tackles` INTEGER NULL,
    `interceptions` INTEGER NULL,
    `clearances` INTEGER NULL,
    `dribblesAttempted` INTEGER NULL,
    `dribblesSucceeded` INTEGER NULL,
    `foulsDrawn` INTEGER NULL,
    `foulsCommitted` INTEGER NULL,
    `yellowCards` INTEGER NULL,
    `redCards` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlayerMatchStats_matchId_idx`(`matchId`),
    INDEX `PlayerMatchStats_playerId_idx`(`playerId`),
    INDEX `PlayerMatchStats_teamId_idx`(`teamId`),
    UNIQUE INDEX `PlayerMatchStats_matchId_playerId_key`(`matchId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shot` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `minute` INTEGER NOT NULL,
    `result` ENUM('GOAL', 'SAVED', 'MISS', 'BLOCK', 'POST') NOT NULL,
    `expectedGoals` DOUBLE NULL,
    `situation` ENUM('REGULAR', 'SET_PIECE', 'FAST_BREAK') NULL,
    `bodyPart` ENUM('RIGHT_FOOT', 'LEFT_FOOT', 'HEAD') NULL,
    `isGoal` BOOLEAN NOT NULL DEFAULT false,
    `isOnTarget` BOOLEAN NOT NULL DEFAULT false,
    `isHeaded` BOOLEAN NOT NULL DEFAULT false,
    `isOutsideBox` BOOLEAN NOT NULL DEFAULT false,
    `isPenalty` BOOLEAN NOT NULL DEFAULT false,
    `goalMouthLocation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Shot_externalId_key`(`externalId`),
    INDEX `Shot_matchId_idx`(`matchId`),
    INDEX `Shot_teamId_idx`(`teamId`),
    INDEX `Shot_playerId_idx`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlayerMatchStats` ADD CONSTRAINT `PlayerMatchStats_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `MatchV2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerMatchStats` ADD CONSTRAINT `PlayerMatchStats_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerMatchStats` ADD CONSTRAINT `PlayerMatchStats_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `MatchV2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
