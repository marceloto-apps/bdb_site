-- Renomear Match antigo para MatchLegacy
RENAME TABLE `matches` TO `matches_legacy`;

-- Renomear MatchV2 para Match
RENAME TABLE `MatchV2` TO `matches`;