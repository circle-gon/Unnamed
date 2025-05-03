import { DC } from "./constants";

// Lazy way to hide the "in this Reversion" text until you know about it
export function reversionTimeText() {
  return PlayerProgress.reversionUnlocked() ? " in this Reversion" : "";
}

export function gainedTimeCapsules() {
  const gain = DC.D1;
  return gain.floor();
}

export function getReversionGain() {
  return 1;
}

function updateReversionStats() {
  player.records.bestReversion.time = player.records.bestReversion.time.min(player.records.thisReversion.time);
  player.records.bestReversion.realTime = player.records.bestReversion.realTime.min(player.records.thisReversion.realTime);
  player.records.bestReversion.trueTime = Math.min(player.records.bestReversion.trueTime, player.records.thisReversion.trueTime);
}

function resetReversionStats() {
  player.records.thisReversion.time = DC.D0;
  player.records.thisReversion.realTime = DC.D0;
  player.records.thisReversion.trueTime = 0;
  player.records.thisReversion.maxAM = DC.D0;
  player.records.thisReversion.maxIP = DC.D0;
  player.records.thisReversion.maxEP = DC.D0;
  player.records.thisReversion.maxRM = DC.D0;
  player.records.thisReversion.maxIM = DC.D0;
}

function askReversionConfirmation() {
  if (player.options.confirmations.reversion) {
    Modal.reversion.show();
  } else {
    revert();
  }
}

function lockAchievementsOnReversion() {
  for (const achievement of Achievements.preReversion) {
    achievement.lock();
  }
  player.reality.achTimer = DC.D0;
}

// eslint-disable-next-line complexity
export function revert() {
  // STUFF TO GAIN
  const timeCapsulesGained = gainedTimeCapsules();
  const reversionsMade = getReversionGain();
  Currency.timeCapsules.add(timeCapsulesGained);
  player.reversion.totalTimeCapsules = player.reversion.totalTimeCapsules.add(timeCapsulesGained);
  Currency.reversions.add(reversionsMade);
  updateReversionStats();
  addReversionTime(player.records.thisReversion.trueTime, player.records.thisReversion.time, player.records.thisReversion.realTime, timeCapsulesGained, reversionsMade);

  EventHub.dispatch(GAME_EVENT.REVERSION_RESET_BEFORE);

  // RESET
  GameEnd.creditsClosed = false;
  GameEnd.creditsEverClosed = false;
  player.isGameEnd = false;

  lockAchievementsOnReversion();

  // Celestials
  Teresa.reset();
  Effarig.reset();
  Enslaved.reset();
  V.reset();
  Ra.reset();
  Laitela.reset();
  Pelle.reset();

  // Reality
  player.reality.upgReqs = 0;
  player.reality.imaginaryUpgReqs = 0;
  player.reality.upgradeBits = 0;
  player.reality.imaginaryUpgradeBits = 0;
  player.reality.realityMachines = DC.D0;
  player.reality.reqLock.reality = 0;
  player.reality.reqLock.imaginary = 0;
  player.reality.imaginaryMachines = DC.D0;
  player.reality.maxRM = DC.D0;
  player.reality.iMCap = DC.D0;
  player.reality.glyphs.sac.power = DC.D0;
  player.reality.glyphs.sac.infinity = DC.D0;
  player.reality.glyphs.sac.replication = DC.D0;
  player.reality.glyphs.sac.time = DC.D0;
  player.reality.glyphs.sac.dilation = DC.D0;
  player.reality.glyphs.sac.effarig = DC.D0;
  player.reality.glyphs.sac.reality = DC.D0;
  player.reality.glyphs.undo = [];
  player.reality.perkPoints = DC.D0;
  player.realities = DC.D0;
  player.reality.perks.clear();

  // Is this necessary? I copied it from Redemption code
  player.reality.glyphs.filter = {
    select: AUTO_GLYPH_SCORE.LOWEST_SACRIFICE,
    trash: AUTO_GLYPH_REJECT.SACRIFICE,
    simple: 0,
    types: GlyphInfo.generatedGlyphTypes
      .mapToObject(t => t, t => ({
        rarity: new Decimal(),
        score: 0,
        effectCount: 0,
        specifiedMask: [],
        effectScores: GlyphInfo[t].effectIDs.mapToObject(e => e, () => 0),
      }))
  };

  for (let i = 1; i <= 5; i++) {
    player.reality.rebuyables[i] = DC.D0;
  }

  for (let i = 1; i <= 10; i++) {
    player.reality.imaginaryRebuyables[i] = DC.D0;
  }

  player.blackHoleNegative = DC.D1;
  player.records.totalTimePlayedAtBHUnlock = DC.BEMAX;
  player.blackHole = Array.range(0, 2).map(id => ({
    id,
    intervalUpgrades: DC.D0,
    powerUpgrades: DC.D0,
    durationUpgrades: DC.D0,
    phase: DC.D0,
    active: false,
    unlocked: false,
    activations: DC.D0,
  }));

  player.records.thisReality = {
    time: DC.D0,
    realTime: DC.D0,
    trueTime: 0,
    maxAM: DC.D0,
    maxIP: DC.D0,
    maxEP: DC.D0,
    bestEternitiesPerMs: DC.D0,
    maxReplicanti: DC.D0,
    maxDT: DC.D0,
    bestRSmin: DC.D0,
    bestRSminVal: DC.D0,
  };
  player.records.bestReality = {
    time: DC.BEMAX,
    realTime: DC.BEMAX,
    trueTime: 0,
    glyphStrength: 0,
    RM: DC.D0,
    RMSet: [],
    RMmin: DC.D0,
    RMminSet: [],
    glyphLevel: 0,
    glyphLevelSet: [],
    bestEP: DC.D0,
    bestEPSet: [],
    speedSet: [],
    iMCapSet: [],
    laitelaSet: [],
  };

  // Remove all glyphs in inventory that aren't companion
  for (const glyph of Glyphs.inventory) {
    if (glyph !== null && glyph.type !== "companion") Glyphs.removeFromInventory(glyph, false);
  }

  // Remove all active glyphs that aren't companion
  for (const activeGlyph of player.reality.glyphs.active) {
    Glyphs.active[activeGlyph.idx] = null;
    if (activeGlyph.type === "companion") {
      // Use the first index available; this prioritizes the protected slots
      const index = Glyphs.inventory.findIndex(i => i !== null);
      if (index < 0) continue;
      Glyphs.addToInventory(activeGlyph, index, true);
    }
  }
  player.reality.glyphs.active = [];

  recalculateAllGlyphs();
  Glyphs.updateMaxGlyphCount(true);
  Glyphs.refreshActive();
  resetRealityRuns();
  clearCelestialRuns();
  player.reality.unlockedEC = 0;
  player.reality.lastAutoEC = DC.D0;
  player.reality.gainedAutoAchievements = false;
  player.reality.hasCheckedFilter = false;

  // Eternity
  player.records.thisEternity.time = DC.D0;
  player.records.thisEternity.realTime = DC.D0;
  player.records.thisEternity.trueTime = 0;
  player.records.thisEternity.maxAM = DC.D0;
  player.records.thisEternity.bestEPmin = DC.D0;
  player.records.thisEternity.bestInfinitiesPerMs = DC.D0;
  player.records.thisEternity.bestIPMsWithoutMaxAll = DC.D0;
  player.records.bestEternity.time = DC.BEMAX;
  player.records.bestEternity.realTime = DC.BEMAX;
  player.records.bestEternity.trueTime = 0;
  player.records.bestEternity.bestEPminReality = DC.D0;
  Currency.timeShards.reset();
  Currency.eternityPoints.reset();
  EternityUpgrade.epMult.reset();
  Currency.eternities.reset();
  player.eternityUpgrades.clear();
  player.totalTickGained = DC.D0;
  player.eternityChalls = {};
  player.challenge.eternity.current = 0;
  player.challenge.eternity.unlocked = 0;
  player.challenge.eternity.requirementBits = 0;
  player.respec = false;
  player.eterc8ids = 50;
  player.eterc8repl = 40;
  Currency.timeTheorems.reset();
  player.dilation.studies = [];
  player.dilation.active = false;
  player.dilation.upgrades.clear();
  player.dilation.rebuyables = {
    1: DC.D0,
    2: DC.D0,
    3: DC.D0,
    11: DC.D0,
    12: DC.D0,
    13: DC.D0,
  };
  Currency.tachyonParticles.reset();
  player.dilation.nextThreshold = DC.E3;
  player.dilation.baseTachyonGalaxies = DC.D0;
  player.dilation.totalTachyonGalaxies = DC.D0;
  Currency.dilatedTime.reset();
  player.dilation.lastEP = DC.DM1;
  resetEternityRuns();
  fullResetTimeDimensions();
  resetTimeDimensions();

  // Infinity
  player.records.bestInfinity.time = DC.BEMAX;
  player.records.bestInfinity.realTime = DC.BEMAX;
  player.records.bestInfinity.trueTime = 0;
  player.records.bestInfinity.bestIPminEternity = DC.D0;
  player.records.thisInfinity.time = DC.D0;
  player.records.thisInfinity.lastBuyTime = DC.D0;
  player.records.thisInfinity.realTime = DC.D0;
  player.records.thisInfinity.trueTime = 0;
  player.records.thisInfinity.maxAM = DC.D0;
  player.records.thisInfinity.bestIPmin = DC.D0;
  initializeChallengeCompletions(true);
  disChargeAll();
  Currency.infinities.reset();
  Currency.infinitiesBanked.reset();
  player.partInfinityPoint = 0;
  player.partInfinitied = 0;
  player.break = false;
  player.IPMultPurchases = DC.D0;
  Currency.infinityPower.reset();
  Replicanti.reset(true);
  playerInfinityUpgradesOnReset();
  resetInfinityRuns();
  InfinityDimensions.fullReset();
  secondSoftReset(false);
  InfinityDimensions.resetAmount();
  Currency.infinityPoints.reset();

  // Pre-Infinity
  player.sacrificed = DC.D0;
  player.dimensionBoosts = DC.D0;
  player.galaxies = DC.D0;
  resetChallengeStuff();
  AntimatterDimensions.reset();
  resetTickspeed();

  // Misc
  resetReversionStats();
  if (player.options.automatorEvents.clearOnReality) AutomatorData.clearEventLog();

  // Technically a Reversion is a Reality but I'm actually not sure so
  if (
    Player.automatorUnlocked &&
    AutomatorBackend.state.forceRealityRestart
  ) {
    // Make sure to restart the current script instead of using the editor script - the editor script might
    // not be a valid script to run; this at best stops it from running and at worst causes a crash
    AutomatorBackend.start(AutomatorBackend.state.topLevelScript);
  }
  AchievementTimers.marathon2.reset();
  Tab.dimensions.antimatter.show();

  Lazy.invalidateAll();
  ECTimeStudyState.invalidateCachedRequirements();
  Player.resetRequirements("reversion");

  // Post-Reset

  // Bug caused by being stuck on another tab while not having any options unlocked
  // Making it impossible to switch tabs
  // We set it to inventory management if any of them are not unlocked since it looks better
  // And the player doesn't need to click on the button in order to fix it
  if (!EffarigUnlock.glyphFilter.isUnlocked || !EffarigUnlock.setSaves.isUnlocked || !Ra.unlocks.unlockGlyphAlchemy.canBeApplied)
    player.reality.showSidebarPanel = GLYPH_SIDEBAR_MODE.INVENTORY_MANAGEMENT;

  Teresa.checkForUnlocks();
  V.updateTotalRunUnlocks();
  V.checkForUnlocks(true);
  Ra.checkForUnlocks();

  EventHub.dispatch(GAME_EVENT.REVERSION_RESET_AFTER);
}

export function reversionResetRequest() {
  if (!Player.canRevert) return;
  askReversionConfirmation();
}