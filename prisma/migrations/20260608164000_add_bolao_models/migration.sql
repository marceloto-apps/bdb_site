-- CreateTable
CREATE TABLE `boloes` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `status` ENUM('ABERTO', 'ENCERRADO') NOT NULL DEFAULT 'ABERTO',
    `premiacao` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bolao_palpites` (
    `id` VARCHAR(191) NOT NULL,
    `bolaoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `golsMandante` INTEGER NOT NULL,
    `golsVisitante` INTEGER NOT NULL,
    `palpiteOverUnder` ENUM('OVER', 'UNDER') NOT NULL,
    `pontos` INTEGER NOT NULL DEFAULT 0,
    `acertouPlacar` BOOLEAN NOT NULL DEFAULT false,
    `acertouResultado` BOOLEAN NOT NULL DEFAULT false,
    `acertouOverUnder` BOOLEAN NOT NULL DEFAULT false,
    `avaliado` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bolao_palpites_matchId_idx`(`matchId`),
    INDEX `bolao_palpites_bolaoId_userId_idx`(`bolaoId`, `userId`),
    UNIQUE INDEX `bolao_palpites_bolaoId_userId_matchId_key`(`bolaoId`, `userId`, `matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bolao_scores` (
    `id` VARCHAR(191) NOT NULL,
    `bolaoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `pontosTotal` INTEGER NOT NULL DEFAULT 0,
    `acertosPlacar` INTEGER NOT NULL DEFAULT 0,
    `acertosResultado` INTEGER NOT NULL DEFAULT 0,
    `acertosOverUnder` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bolao_scores_bolaoId_pontosTotal_acertosPlacar_acertosResul_idx`(`bolaoId`, `pontosTotal`, `acertosPlacar`, `acertosResultado`, `acertosOverUnder`),
    UNIQUE INDEX `bolao_scores_bolaoId_userId_key`(`bolaoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bolao_palpites` ADD CONSTRAINT `bolao_palpites_bolaoId_fkey` FOREIGN KEY (`bolaoId`) REFERENCES `boloes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolao_palpites` ADD CONSTRAINT `bolao_palpites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolao_palpites` ADD CONSTRAINT `bolao_palpites_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolao_scores` ADD CONSTRAINT `bolao_scores_bolaoId_fkey` FOREIGN KEY (`bolaoId`) REFERENCES `boloes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolao_scores` ADD CONSTRAINT `bolao_scores_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
