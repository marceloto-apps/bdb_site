-- CreateTable
CREATE TABLE `Competition` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `type` ENUM('LEAGUE', 'CUP', 'TOURNAMENT') NOT NULL DEFAULT 'LEAGUE',
    `tier` ENUM('FREE', 'VIP') NOT NULL DEFAULT 'FREE',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `slug` VARCHAR(191) NOT NULL,
    `hasTeamStats` BOOLEAN NOT NULL DEFAULT false,
    `hasPlayerStats` BOOLEAN NOT NULL DEFAULT false,
    `xgAvailable` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Competition_externalId_key`(`externalId`),
    UNIQUE INDEX `Competition_slug_key`(`slug`),
    INDEX `Competition_country_idx`(`country`),
    INDEX `Competition_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Season` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Season_externalId_key`(`externalId`),
    INDEX `Season_competitionId_idx`(`competitionId`),
    INDEX `Season_isCurrent_idx`(`isCurrent`),
    UNIQUE INDEX `Season_competitionId_year_key`(`competitionId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Season` ADD CONSTRAINT `Season_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `Competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
