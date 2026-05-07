-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'EDITOR', 'AUTOR', 'MEMBRO') NOT NULL DEFAULT 'MEMBRO',
    `plan` ENUM('FREE', 'BASICO', 'PRO', 'PREMIUM') NOT NULL DEFAULT 'FREE',
    `password` VARCHAR(191) NULL,
    `newsletterOptIn` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `stripeCustomerId` VARCHAR(191) NOT NULL,
    `stripeSubscriptionId` VARCHAR(191) NULL,
    `stripePriceId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALING', 'UNPAID') NOT NULL DEFAULT 'INCOMPLETE',
    `currentPeriodStart` DATETIME(3) NULL,
    `currentPeriodEnd` DATETIME(3) NULL,
    `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_userId_key`(`userId`),
    UNIQUE INDEX `subscriptions_stripeCustomerId_key`(`stripeCustomerId`),
    UNIQUE INDEX `subscriptions_stripeSubscriptionId_key`(`stripeSubscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `type` ENUM('ESTUDO', 'ANALISE', 'ARTIGO') NOT NULL,
    `status` ENUM('RASCUNHO', 'REVISAO', 'PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
    `authorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `minPlan` ENUM('FREE', 'BASICO', 'PRO', 'PREMIUM') NOT NULL DEFAULT 'FREE',

    UNIQUE INDEX `articles_slug_key`(`slug`),
    INDEX `articles_status_type_idx`(`status`, `type`),
    INDEX `articles_authorId_idx`(`authorId`),
    INDEX `articles_categoryId_idx`(`categoryId`),
    INDEX `articles_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_tags` (
    `articleId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`articleId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(191) NOT NULL,
    `editorId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('RASCUNHO', 'REVISAO', 'PUBLICADO') NOT NULL,
    `toStatus` ENUM('RASCUNHO', 'REVISAO', 'PUBLICADO') NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `article_revisions_articleId_idx`(`articleId`),
    INDEX `article_revisions_editorId_idx`(`editorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `favorites_userId_articleId_key`(`userId`, `articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `read_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `read_history_userId_readAt_idx`(`userId`, `readAt`),
    UNIQUE INDEX `read_history_userId_articleId_key`(`userId`, `articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spreadsheets` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `league` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` VARCHAR(191) NULL,
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leagues` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `season` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'VIP') NOT NULL DEFAULT 'FREE',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `externalId` VARCHAR(191) NULL,

    UNIQUE INDEX `leagues_slug_key`(`slug`),
    UNIQUE INDEX `leagues_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NULL,
    `leagueId` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NULL,

    INDEX `teams_leagueId_idx`(`leagueId`),
    UNIQUE INDEX `teams_name_leagueId_key`(`name`, `leagueId`),
    UNIQUE INDEX `teams_externalId_leagueId_key`(`externalId`, `leagueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `leagueId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `round` INTEGER NULL,
    `homeTeamId` VARCHAR(191) NOT NULL,
    `awayTeamId` VARCHAR(191) NOT NULL,
    `fthg` INTEGER NULL,
    `ftag` INTEGER NULL,
    `ftr` ENUM('H', 'D', 'A') NULL,
    `homeXg` DOUBLE NULL,
    `awayXg` DOUBLE NULL,
    `homePossession` DOUBLE NULL,
    `awayPossession` DOUBLE NULL,
    `homeShots` INTEGER NULL,
    `awayShots` INTEGER NULL,
    `homeShotsOT` INTEGER NULL,
    `awayShotsOT` INTEGER NULL,
    `homeCorners` INTEGER NULL,
    `awayCorners` INTEGER NULL,
    `pinHome` DOUBLE NULL,
    `pinDraw` DOUBLE NULL,
    `pinAway` DOUBLE NULL,
    `pinOver25` DOUBLE NULL,
    `pinUnder25` DOUBLE NULL,
    `pinBttsYes` DOUBLE NULL,
    `pinBttsNo` DOUBLE NULL,
    `pinAhLine` DOUBLE NULL,
    `pinAhHome` DOUBLE NULL,
    `pinAhAway` DOUBLE NULL,
    `pinOpenHome` DOUBLE NULL,
    `pinOpenDraw` DOUBLE NULL,
    `pinOpenAway` DOUBLE NULL,
    `b365Home` DOUBLE NULL,
    `b365Draw` DOUBLE NULL,
    `b365Away` DOUBLE NULL,
    `b365Over25` DOUBLE NULL,
    `b365Under25` DOUBLE NULL,
    `bfexHome` DOUBLE NULL,
    `bfexDraw` DOUBLE NULL,
    `bfexAway` DOUBLE NULL,
    `oddHome` DOUBLE NULL,
    `oddDraw` DOUBLE NULL,
    `oddAway` DOUBLE NULL,
    `oddOver25` DOUBLE NULL,
    `oddUnder25` DOUBLE NULL,
    `oddBttsYes` DOUBLE NULL,
    `oddBttsNo` DOUBLE NULL,
    `externalId` VARCHAR(191) NULL,
    `dataSource` ENUM('THESTATSAPI', 'FOOTBALL_DATA', 'MANUAL') NOT NULL DEFAULT 'THESTATSAPI',
    `sourceFile` VARCHAR(191) NULL,
    `syncedAt` DATETIME(3) NULL,
    `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `matches_externalId_key`(`externalId`),
    INDEX `matches_leagueId_date_idx`(`leagueId`, `date`),
    INDEX `matches_homeTeamId_idx`(`homeTeamId`),
    INDEX `matches_awayTeamId_idx`(`awayTeamId`),
    INDEX `matches_date_idx`(`date`),
    INDEX `matches_externalId_idx`(`externalId`),
    INDEX `matches_sourceFile_idx`(`sourceFile`),
    INDEX `matches_dataSource_idx`(`dataSource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_imports` (
    `id` VARCHAR(191) NOT NULL,
    `leagueId` VARCHAR(191) NOT NULL,
    `importedById` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `rowsProcessed` INTEGER NOT NULL,
    `rowsCreated` INTEGER NOT NULL,
    `rowsUpdated` INTEGER NOT NULL,
    `rowsSkipped` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_imports_leagueId_idx`(`leagueId`),
    INDEX `match_imports_importedById_idx`(`importedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_quota_logs` (
    `id` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `responseStatus` INTEGER NULL,
    `month` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `api_quota_logs_month_idx`(`month`),
    INDEX `api_quota_logs_endpoint_month_idx`(`endpoint`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_tags` ADD CONSTRAINT `article_tags_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_tags` ADD CONSTRAINT `article_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_revisions` ADD CONSTRAINT `article_revisions_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_revisions` ADD CONSTRAINT `article_revisions_editorId_fkey` FOREIGN KEY (`editorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `read_history` ADD CONSTRAINT `read_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `read_history` ADD CONSTRAINT `read_history_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_imports` ADD CONSTRAINT `match_imports_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_imports` ADD CONSTRAINT `match_imports_importedById_fkey` FOREIGN KEY (`importedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

