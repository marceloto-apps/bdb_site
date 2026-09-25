-- CreateTable
CREATE TABLE `backtest_strategies` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `definicao` JSON NOT NULL,
    `engineVersao` VARCHAR(191) NOT NULL,
    `catalogoVersao` VARCHAR(191) NOT NULL,
    `publica` BOOLEAN NOT NULL DEFAULT false,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `holdoutAberto` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `backtest_strategies_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backtest_runs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `strategyId` VARCHAR(191) NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'WORKER',
    `datasetVersao` VARCHAR(191) NOT NULL,
    `engineVersao` VARCHAR(191) NOT NULL,
    `catalogoVersao` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `nUniverso` INTEGER NOT NULL,
    `nApostas` INTEGER NOT NULL,
    `resumo` JSON NOT NULL,
    `apostas` JSON NULL,
    `definicao` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `backtest_runs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `backtest_runs_strategyId_createdAt_idx`(`strategyId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backtest_indicators` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `formula` TEXT NOT NULL,
    `ast` JSON NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `publico` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `backtest_indicators_publico_idx`(`publico`),
    UNIQUE INDEX `backtest_indicators_userId_nome_key`(`userId`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backtest_trial_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `strategyId` VARCHAR(191) NULL,
    `hashRegra` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `backtest_trial_logs_userId_strategyId_idx`(`userId`, `strategyId`),
    INDEX `backtest_trial_logs_userId_hashRegra_idx`(`userId`, `hashRegra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `backtest_strategies` ADD CONSTRAINT `backtest_strategies_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backtest_runs` ADD CONSTRAINT `backtest_runs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backtest_runs` ADD CONSTRAINT `backtest_runs_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `backtest_strategies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backtest_indicators` ADD CONSTRAINT `backtest_indicators_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backtest_trial_logs` ADD CONSTRAINT `backtest_trial_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backtest_trial_logs` ADD CONSTRAINT `backtest_trial_logs_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `backtest_strategies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

