-- ============================================================
-- FASE S — Migration: BigDataBet Ingest Infrastructure
-- Data: 2026-05-07
-- Banco: bigda077_site
-- ============================================================

-- ============================================================
-- S.1 — CREATE TABLE odds_movements
-- ============================================================

CREATE TABLE IF NOT EXISTS `odds_movements` (
  `id` VARCHAR(191) NOT NULL,
  `matchId` VARCHAR(191) NOT NULL,
  `bookmakerId` VARCHAR(191) NOT NULL,
  `marketId` VARCHAR(191) NOT NULL,
  `selection` VARCHAR(191) NOT NULL,
  `line` DOUBLE NULL,
  `odds` DOUBLE NOT NULL,
  `oddsType` ENUM('PREMATCH_OPENING', 'PREMATCH_CLOSING') NOT NULL,
  `capturedAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  INDEX `odds_movements_matchId_bookmakerId_marketId_selection_idx`
    (`matchId`, `bookmakerId`, `marketId`, `selection`),

  INDEX `odds_movements_matchId_capturedAt_idx`
    (`matchId`, `capturedAt`),

  CONSTRAINT `odds_movements_matchId_fkey`
    FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `odds_movements_bookmakerId_fkey`
    FOREIGN KEY (`bookmakerId`) REFERENCES `Bookmaker`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `odds_movements_marketId_fkey`
    FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- S.2 — CREATE TABLE ingest_jobs
-- ============================================================

CREATE TABLE IF NOT EXISTS `ingest_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `jobType` VARCHAR(50) NOT NULL,
  `competitionId` VARCHAR(191) NULL,
  `seasonId` VARCHAR(191) NULL,
  `status` VARCHAR(30) NOT NULL,
  `matchesProcessed` INT NOT NULL DEFAULT 0,
  `requestsUsed` INT NOT NULL DEFAULT 0,
  `error` TEXT NULL,
  `checkpoint` JSON NULL,
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  INDEX `ingest_jobs_jobType_status_idx`
    (`jobType`, `status`),

  INDEX `ingest_jobs_competitionId_seasonId_idx`
    (`competitionId`, `seasonId`),

  CONSTRAINT `ingest_jobs_competitionId_fkey`
    FOREIGN KEY (`competitionId`) REFERENCES `Competition`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `ingest_jobs_seasonId_fkey`
    FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- S.3 — ALTER TABLE Season (adicionar campos de sync)
-- ============================================================

ALTER TABLE `Season`
  ADD COLUMN `lastSyncedAt` DATETIME(3) NULL,
  ADD COLUMN `syncStatus` VARCHAR(50) NULL;


