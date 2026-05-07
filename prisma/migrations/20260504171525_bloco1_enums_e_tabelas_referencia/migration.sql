-- CreateTable
CREATE TABLE `Bookmaker` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isSharp` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Bookmaker_name_key`(`name`),
    UNIQUE INDEX `Bookmaker_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Market` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Market_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `position` ENUM('FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER') NULL,
    `dateOfBirth` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `nationality` VARCHAR(191) NULL,
    `heightCm` INTEGER NULL,
    `currentTeamId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Player_externalId_key`(`externalId`),
    INDEX `Player_currentTeamId_idx`(`currentTeamId`),
    INDEX `Player_nationality_idx`(`nationality`),
    INDEX `Player_position_idx`(`position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
