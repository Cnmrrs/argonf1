import React, { useEffect, useState } from 'react';
import {
  CarPartType,
  CareerState,
  ContractTerms,
  DriverEntity,
  DriverRole,
  FacilityType,
  GameMode,
  InboxEvent,
  Language,
  SponsorContract,
  StaffDepartment,
  StaffEntity,
  ThemeMode,
} from './core/types';
import { formatCurrency, formatLapTime, t } from './core/i18n';
import {
  buildDriversForSeason,
  buildTeamsForSeason,
  createInitialCareerState,
  getRegulationsForYear,
  SCENARIOS,
  SPONSOR_CATALOG,
} from './data/seasonsAndData';
import {
  advanceCareerWeek,
  calculateTeamCarPerformance,
} from './simulation/simulationEngine';
import {
  deleteSaveSlot,
  exportCareerBackupJson,
  importCareerBackupFile,
  listSaveSlots,
  loadCareerFromDb,
  saveCareerToDb,
  SaveSlotSummary,
} from './database/indexedDb';
import { ThreeCarAndTrack } from './rendering/ThreeCarAndTrack';
import { TeamLogoSvg } from './ui/TeamLogoSvg';
import { DesignStudioView } from './ui/DesignStudioModal';
import { NegotiationModal } from './ui/NegotiationModal';
import { RaceWeekendView } from './ui/RaceWeekendView';
import { RaceSessionBundle } from './race-engine/raceSimulator';
import { soundEngine } from './audio/soundEngine';

type ScreenState = 'TITLE' | 'SETUP_WIZARD' | 'HQ' | 'RACE_WEEKEND';
type HqTab =
  | 'dashboard'
  | 'drivers'
  | 'staff'
  | 'cardev'
  | 'design'
  | 'facilities'
  | 'finance'
  | 'transfer'
  | 'boardmedia'
  | 'standings'
  | 'saves';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('TITLE');
  const [lang, setLang] = useState<Language>('tr');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [muted, setMuted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Career State & IndexedDB Slots
  const [career, setCareer] = useState<CareerState | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>([]);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Setup Wizard State
  const [selectedMode, setSelectedMode] = useState<GameMode>('principal');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
  const [teamChoiceMode, setTeamChoiceMode] = useState<'existing' | 'custom'>('custom');
  const [selectedExistingTeamId, setSelectedExistingTeamId] = useState<string>('ferrari');
  const [playerName, setPlayerName] = useState<string>('Altan Erus');

  // Custom Team ("Senin Takımın") Creation State
  const [customTeamName, setCustomTeamName] = useState<string>('Senin Takımın');
  const [customNationality, setCustomNationality] = useState<string>('Türkiye');
  const [customHq, setCustomHq] = useState<string>('İstanbul, Türkiye');
  const [customPrimary, setCustomPrimary] = useState<string>('#e11d48');
  const [customSecondary, setCustomSecondary] = useState<string>('#0f172a');
  const [customAccent, setCustomAccent] = useState<string>('#38bdf8');
  const [customEngine, setCustomEngine] = useState<string>('Ferrari');
  const [customBudget, setCustomBudget] = useState<number>(95_000_000);
  const [customFacLvl, setCustomFacLvl] = useState<number>(3);
  const [customLeadDriver, setCustomLeadDriver] = useState<string>('guven');
  const [customSecondDriver, setCustomSecondDriver] = useState<string>('bolukbasi');

  // HQ Navigation & Active Modals
  const [hqTab, setHqTab] = useState<HqTab>('dashboard');
  const [staffFilterDept, setStaffFilterDept] = useState<StaffDepartment | 'all'>('all');
  const [transferSearch, setTransferSearch] = useState<string>('');
  const [negotiationTarget, setNegotiationTarget] = useState<{
    entity: DriverEntity | StaffEntity;
    isDriver: boolean;
  } | null>(null);
  const [customSaveNameInput, setCustomSaveNameInput] = useState<string>('');

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load save slots on mount
  const refreshSaveSlots = async () => {
    try {
      const list = await listSaveSlots();
      setSaveSlots(list);
    } catch {
      // IndexedDB fallback
    }
  };

  useEffect(() => {
    refreshSaveSlots();
  }, []);

  // Keyboard shortcut on Title Screen (Enter / Space to start)
  useEffect(() => {
    if (screen !== 'TITLE' || showLoadModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setScreen('SETUP_WIZARD');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, showLoadModal]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const handleStartNewCareer = async () => {
    soundEngine.playClick();
    const effectiveYear =
      selectedMode === 'scenario'
        ? SCENARIOS.find((s) => s.id === selectedScenarioId)?.seasonYear || 2026
        : selectedYear;

    const newCareer = createInitialCareerState({
      gameMode: selectedMode,
      seasonYear: effectiveYear,
      playerTeamId:
        selectedMode === 'scenario'
          ? SCENARIOS.find((s) => s.id === selectedScenarioId)?.recommendedTeamId || 'alpine'
          : selectedExistingTeamId,
      playerName: playerName.trim() || 'Takım Patronu',
      scenarioId: selectedMode === 'scenario' ? selectedScenarioId : undefined,
      customTeamConfig:
        teamChoiceMode === 'custom' && selectedMode !== 'scenario'
          ? {
              name: customTeamName.trim() || 'Senin Takımın',
              nationality: customNationality,
              headquarters: customHq,
              primaryColor: customPrimary,
              secondaryColor: customSecondary,
              accentColor: customAccent,
              engineSupplier: customEngine,
              initialBudget: customBudget,
              facilityLevel: customFacLvl,
              leadDriverId: customLeadDriver,
              secondDriverId: customSecondDriver,
            }
          : undefined,
    });

    setCareer(newCareer);
    setCustomSaveNameInput(newCareer.saveName);
    await saveCareerToDb(newCareer, true);
    await refreshSaveSlots();
    setScreen('HQ');
    notify(`${newCareer.saveName} kariyeri başlatıldı ve otomatik kaydedildi.`);
  };

  const handleLoadSlot = async (saveId: string) => {
    soundEngine.playClick();
    const loaded = await loadCareerFromDb(saveId);
    if (loaded) {
      setCareer(loaded);
      setCustomSaveNameInput(loaded.saveName);
      setShowLoadModal(false);
      setScreen('HQ');
      notify(`"${loaded.saveName}" kaydı yüklendi.`);
    }
  };

  const handleAdvanceWeek = async () => {
    if (!career) return;
    soundEngine.playClick();
    const nextState = advanceCareerWeek(career);
    setCareer(nextState);
    await saveCareerToDb(nextState, true);
    await refreshSaveSlots();
    notify(`Hafta ${nextState.currentWeek} simüle edildi (Ar-Ge, Finans ve AI Takımlar güncellendi).`);
  };

  const handleEventChoice = (eventItem: InboxEvent, choiceId: string) => {
    if (!career || !eventItem.choices) return;
    soundEngine.playClick();
    const chosen = eventItem.choices.find((c) => c.id === choiceId);
    if (!chosen) return;

    const updatedTeams = career.teams.map((tm) => {
      if (tm.id !== career.playerTeamId) return tm;
      return {
        ...tm,
        budget: tm.budget + (chosen.budgetDelta || 0),
        boardConfidence: Math.max(
          10,
          Math.min(100, tm.boardConfidence + (chosen.boardConfidenceDelta || 0))
        ),
        reputation: Math.max(10, Math.min(100, tm.reputation + (chosen.reputationDelta || 0))),
      };
    });

    const updatedDrivers = career.drivers.map((drv) => {
      if (drv.teamId !== career.playerTeamId) return drv;
      const healed = choiceId === 'rest_driver_use_reserve' && drv.healthStatus !== 'healthy';
      return {
        ...drv,
        morale: Math.max(10, Math.min(100, drv.morale + (chosen.moraleDelta || 0))),
        healthStatus: healed ? 'healthy' : drv.healthStatus,
        recoveryWeeksLeft: healed ? 0 : drv.recoveryWeeksLeft,
      };
    });

    const updatedInbox = career.inbox.map((item) =>
      item.id === eventItem.id
        ? { ...item, read: true, resolvedChoiceId: choiceId }
        : item
    );

    const next = {
      ...career,
      teams: updatedTeams,
      drivers: updatedDrivers,
      inbox: updatedInbox,
    };
    setCareer(next);
    saveCareerToDb(next, true);
    notify(`Karar uygulandı: ${chosen.effectSummaryTr}`);
  };

  const handleStartPartRD = (partKey: CarPartType, risky: boolean) => {
    if (!career) return;
    const pTeam = career.teams.find((t) => t.id === career.playerTeamId)!;
    const part = pTeam.parts[partKey];
    if (part.inDevelopment) return;

    const cost = risky ? part.manufacturingCost * 1.45 : part.manufacturingCost;
    if (!career.sandboxSettings.unlimitedBudget && pTeam.budget < cost) {
      notify('Yetersiz bütçe! Bu Ar-Ge projesi için yeterli nakit yok.');
      return;
    }

    soundEngine.playClick();
    const windTunnelLvl = pTeam.facilities.windTunnel?.level || 3;
    const baseGain = Math.max(2, Math.round(windTunnelLvl * 0.8 + (risky ? 3 : 1)));

    const updatedTeams = career.teams.map((tm) => {
      if (tm.id !== career.playerTeamId) return tm;
      return {
        ...tm,
        budget: career.sandboxSettings.unlimitedBudget ? tm.budget : tm.budget - cost,
        costCapSpent: tm.costCapSpent + cost,
        parts: {
          ...tm.parts,
          [partKey]: {
            ...part,
            inDevelopment: {
              targetName: `${part.nameTr} Spec ${part.level + 1}`,
              weeksRemaining: risky ? 2 : 3,
              totalWeeks: risky ? 2 : 3,
              expectedGain: baseGain,
              riskFactor: risky ? 0.6 : 0.15,
              costAllocated: cost,
            },
          },
        },
      };
    });

    const next: CareerState = {
      ...career,
      teams: updatedTeams,
      ledger: [
        {
          id: `led_rd_${Date.now()}`,
          week: career.currentWeek,
          category: 'RD',
          descriptionTr: `Ar-Ge Projesi Başlatıldı: ${part.nameTr} Spec ${part.level + 1}`,
          descriptionEn: `R&D Project Started: ${part.nameEn} Spec ${part.level + 1}`,
          amount: -cost,
          countsTowardCostCap: true,
        },
        ...career.ledger,
      ],
    };
    setCareer(next);
    saveCareerToDb(next, true);
    notify(`${part.nameTr} Spec ${part.level + 1} geliştirme süreci başlatıldı (-${formatCurrency(cost)}).`);
  };

  const handleUpgradeFacility = (facKey: FacilityType) => {
    if (!career) return;
    const pTeam = career.teams.find((t) => t.id === career.playerTeamId)!;
    const fac = pTeam.facilities[facKey];
    if (fac.level >= 5 || fac.upgradeWeeksLeft > 0) return;

    if (!career.sandboxSettings.unlimitedBudget && pTeam.budget < fac.upgradeCost) {
      notify('Yetersiz bütçe! Tesis yükseltmesi için yeterli nakit yok.');
      return;
    }

    soundEngine.playClick();
    const updatedTeams = career.teams.map((tm) => {
      if (tm.id !== career.playerTeamId) return tm;
      return {
        ...tm,
        budget: career.sandboxSettings.unlimitedBudget ? tm.budget : tm.budget - fac.upgradeCost,
        facilities: {
          ...tm.facilities,
          [facKey]: {
            ...fac,
            upgradeWeeksLeft: 3,
          },
        },
      };
    });

    const next: CareerState = {
      ...career,
      teams: updatedTeams,
      ledger: [
        {
          id: `led_fac_up_${Date.now()}`,
          week: career.currentWeek,
          category: 'FACILITY',
          descriptionTr: `Tesis Yatırımı: ${fac.nameTr} (Seviye ${fac.level + 1} İnşası)`,
          descriptionEn: `Facility Upgrade: ${fac.nameEn} Level ${fac.level + 1}`,
          amount: -fac.upgradeCost,
          countsTowardCostCap: false,
        },
        ...career.ledger,
      ],
    };
    setCareer(next);
    saveCareerToDb(next, true);
    notify(`${fac.nameTr} Seviye ${fac.level + 1} inşaatı başlatıldı.`);
  };

  const handleAcceptNegotiatedContract = (
    targetId: string,
    isDriver: boolean,
    finalTerms: ContractTerms,
    buyoutPaid: number
  ) => {
    if (!career) return;
    const totalImmediateCost = finalTerms.signingBonus + buyoutPaid;
    const pTeam = career.teams.find((t) => t.id === career.playerTeamId)!;

    if (!career.sandboxSettings.unlimitedBudget && pTeam.budget < totalImmediateCost) {
      notify('İmza primi ve bonservis bedeli için yeterli nakit bütçeniz yok!');
      return;
    }

    const updatedTeams = career.teams.map((tm) => {
      if (tm.id !== career.playerTeamId) return tm;
      return {
        ...tm,
        budget: career.sandboxSettings.unlimitedBudget ? tm.budget : tm.budget - totalImmediateCost,
      };
    });

    const updatedDrivers = isDriver
      ? career.drivers.map((d) =>
          d.id === targetId
            ? {
                ...d,
                teamId: career.playerTeamId,
                role: finalTerms.guaranteedRole || d.role,
                contract: finalTerms,
                morale: Math.min(100, d.morale + 10),
              }
            : d
        )
      : career.drivers;

    const updatedStaff = !isDriver
      ? career.staff.map((s) =>
          s.id === targetId
            ? {
                ...s,
                teamId: career.playerTeamId,
                contract: finalTerms,
                morale: Math.min(100, s.morale + 10),
                onGardeningLeaveUntilWeek:
                  s.teamId && s.teamId !== career.playerTeamId
                    ? Math.ceil(s.contract.gardeningLeaveMonths / 2)
                    : 0,
              }
            : s
        )
      : career.staff;

    const next: CareerState = {
      ...career,
      teams: updatedTeams,
      drivers: updatedDrivers,
      staff: updatedStaff,
    };
    setCareer(next);
    setNegotiationTarget(null);
    saveCareerToDb(next, true);
    notify('Sözleşme resmen imzalandı ve FIA Kayıt Kuruluna tescil ettirildi!');
  };

  const handleCompleteRaceWeekend = async (
    finalBundle: RaceSessionBundle,
    interviewChoice: 'praiseTeam' | 'demandMoreAero' | 'criticizeStewards'
  ) => {
    if (!career) return;
    soundEngine.playClick();

    const pointsTable = career.regulations.pointsSystem;
    const driverPointsEarned = new Map<string, number>();
    const teamPointsEarned = new Map<string, number>();
    const driverWinsEarned = new Map<string, number>();
    const driverPodiumsEarned = new Map<string, number>();

    finalBundle.cars.forEach((car, idx) => {
      if (car.status === 'OUT') return;
      const pts = pointsTable[idx] || 0;
      driverPointsEarned.set(car.driverId, pts);
      teamPointsEarned.set(car.teamId, (teamPointsEarned.get(car.teamId) || 0) + pts);
      if (idx === 0) driverWinsEarned.set(car.driverId, 1);
      if (idx < 3) driverPodiumsEarned.set(car.driverId, 1);
    });

    const playerPtsThisRace = teamPointsEarned.get(career.playerTeamId) || 0;
    const prizeBonus = 1_200_000 + playerPtsThisRace * 180_000;

    const updatedDrivers = career.drivers.map((drv) => {
      const pts = driverPointsEarned.get(drv.id) || 0;
      const win = driverWinsEarned.get(drv.id) || 0;
      const pod = driverPodiumsEarned.get(drv.id) || 0;
      return {
        ...drv,
        seasonPoints: drv.seasonPoints + pts,
        seasonWins: drv.seasonWins + win,
        seasonPodiums: drv.seasonPodiums + pod,
        careerWins: drv.careerWins + win,
        careerPodiums: drv.careerPodiums + pod,
        morale:
          drv.teamId === career.playerTeamId && interviewChoice === 'praiseTeam'
            ? Math.min(100, drv.morale + 6)
            : drv.morale,
      };
    });

    const updatedTeams = career.teams.map((tm) => {
      const pts = teamPointsEarned.get(tm.id) || 0;
      const isPlayer = tm.id === career.playerTeamId;
      return {
        ...tm,
        seasonPoints: tm.seasonPoints + pts,
        budget: isPlayer ? tm.budget + prizeBonus : tm.budget + 1_000_000 + pts * 120_000,
        boardConfidence: isPlayer
          ? Math.max(
              15,
              Math.min(100, tm.boardConfidence + (pts >= 10 ? 6 : pts > 0 ? 2 : -4))
            )
          : tm.boardConfidence,
      };
    });

    const nextRoundIndex = (career.currentRoundIndex + 1) % career.calendar.length;
    const advancedState = advanceCareerWeek({
      ...career,
      currentRoundIndex: nextRoundIndex,
      teams: updatedTeams,
      drivers: updatedDrivers,
      ledger: [
        {
          id: `led_prize_${Date.now()}`,
          week: career.currentWeek,
          category: 'PRIZE',
          descriptionTr: `${finalBundle.circuit.name} GP Yarış Primi (+${playerPtsThisRace} Puan)`,
          descriptionEn: `${finalBundle.circuit.name} GP Prize Distribution`,
          amount: prizeBonus,
          countsTowardCostCap: false,
        },
        ...career.ledger,
      ],
    });

    setCareer(advancedState);
    await saveCareerToDb(advancedState, true);
    await refreshSaveSlots();
    setScreen('HQ');
    notify(
      `${finalBundle.circuit.name} GP tamamlandı! Takımınız ${playerPtsThisRace} puan ve ${formatCurrency(prizeBonus)} ödül kazandı.`
    );
  };

  // ============================================================================
  // RENDER 1: TITLE SCREEN (GAME SHELL)
  // ============================================================================
  if (screen === 'TITLE') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
        {/* Live 3D Showroom Centerpiece Canvas */}
        <div className="absolute inset-0 z-0">
          <ThreeCarAndTrack mode="showroom" cameraPreset="broadcast" />
        </div>

        {/* Measured Gradient Scrim for 4.5:1 Contrast */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/75" />

        {/* Top Perimeter Bar (pointer-events-none wrapper, pointer-events-auto children) */}
        <div className="relative z-20 pointer-events-none flex items-center justify-between px-8 py-6">
          <div className="pointer-events-auto flex items-center gap-3">
            <span className="text-xs font-mono tracking-widest text-rose-500 font-bold">
              ARGON MOTORSPORT SIMULATION ENGINE · OFFLINE-READY
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="px-3 py-1.5 text-xs font-mono bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded text-slate-200"
            >
              DİL: {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-3 py-1.5 text-xs font-mono bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded text-slate-200"
            >
              TEMA: {theme === 'dark' ? 'KOYU' : 'AÇIK'}
            </button>
            <button
              onClick={() => {
                const next = !muted;
                setMuted(next);
                soundEngine.muted = next;
              }}
              className="px-3 py-1.5 text-xs font-mono bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded text-slate-200"
            >
              SES: {muted ? 'KAPALI' : 'AÇIK'}
            </button>
          </div>
        </div>

        {/* Bottom-Left Hero Lockup & Primary CTAs (Leaves 80%+ of 3D car unobstructed) */}
        <div className="absolute bottom-10 left-8 right-8 z-20 pointer-events-none flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="pointer-events-auto max-w-xl space-y-4">
            {/* Bespoke Inline SVG Title Lockup */}
            <svg viewBox="0 0 460 76" className="w-72 sm:w-96 h-auto">
              <defs>
                <linearGradient id="argonTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
              <polygon points="0,14 48,14 34,62 0,62" fill="#e11d48" />
              <polygon points="44,14 58,14 44,62 30,62" fill="#38bdf8" />
              <text
                x="72"
                y="56"
                fill="url(#argonTitleGrad)"
                fontFamily="Chakra Petch, sans-serif"
                fontWeight="700"
                fontStyle="italic"
                fontSize="54"
                letterSpacing="2"
              >
                ARGON F1
              </text>
            </svg>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Formula 1 Takım Patronu, Organizasyon Yönetimi, 2000–2026 Tarihsel Sezonlar, 3B Tasarım Stüdyosu ve Canlı Yarış Strateji Simülatörü.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setScreen('SETUP_WIZARD');
                }}
                className="px-6 py-3 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg transition-colors whitespace-nowrap"
              >
                {t(lang, 'startCareer')} (Enter)
              </button>

              {saveSlots.length > 0 && (
                <button
                  onClick={() => handleLoadSlot(saveSlots[0].saveId)}
                  className="px-5 py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  Son Kayda Devam Et ({saveSlots[0].teamName})
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowLoadModal(true);
                }}
                className="px-5 py-3 text-sm font-semibold bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                {t(lang, 'loadSave')} ({saveSlots.length})
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="pointer-events-auto text-xs font-mono text-slate-400 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-lg">
            Sol Tık + Sürükle: 3B Aracı İncele · Tekerlek: Yakınlaştır · Enter / Space: Kariyere Başla
          </div>
        </div>

        {/* Load / Import Save Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white font-display">
                  IndexedDB Kayıt Yuvaları & JSON Yedek Yükleme
                </h3>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded"
                >
                  Kapat
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {saveSlots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-lg border border-slate-800">
                    Henüz kaydedilmiş bir kariyer bulunamadı. Yeni bir kariyer başlatın veya JSON yedek dosyası yükleyin.
                  </div>
                ) : (
                  saveSlots.map((slot) => (
                    <div
                      key={slot.saveId}
                      className="flex items-center justify-between p-3.5 bg-slate-950 rounded-lg border border-slate-800"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{slot.saveName}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {slot.teamName} · Sezon {slot.seasonYear} · Hafta {slot.currentWeek} · Bütçe:{' '}
                          {formatCurrency(slot.budget)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadSlot(slot.saveId)}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded"
                        >
                          Yükle
                        </button>
                        <button
                          onClick={async () => {
                            await deleteSaveSlot(slot.saveId);
                            await refreshSaveSlots();
                          }}
                          className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-rose-900 text-slate-300 rounded"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Dışa aktarılmış bir `.json` yedek dosyasından geri yükleyin:
                </span>
                <label className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer border border-slate-700">
                  JSON Yedek Dosyası Seç
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const imported = await importCareerBackupFile(file);
                        setCareer(imported);
                        await refreshSaveSlots();
                        setShowLoadModal(false);
                        setScreen('HQ');
                        notify('JSON yedek dosyası başarıyla içe aktarıldı!');
                      } catch (err) {
                        notify((err as Error).message);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: GAME MODE, SEASON (2000-2026) & TEAM CREATION WIZARD
  // ============================================================================
  if (screen === 'SETUP_WIZARD') {
    const previewRegulations = getRegulationsForYear(selectedYear);
    const previewTeams = buildTeamsForSeason(selectedYear);
    const previewDrivers = buildDriversForSeason(selectedYear);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-rose-500 font-bold">
                ARGON F1 KARİYER YAPILANDIRMA MERKEZİ
              </span>
              <h1 className="text-2xl font-bold text-white font-display">
                {t(lang, 'selectGameMode')}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('TITLE')}
                className="px-4 py-2 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300"
              >
                Ana Ekrana Dön
              </button>
              <button
                onClick={handleStartNewCareer}
                className="px-6 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg"
              >
                Kariyeri Başlat & Karargaha Gir
              </button>
            </div>
          </div>

          {/* 1. Game Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(
              [
                ['owner', t(lang, 'modeOwnerTitle'), t(lang, 'modeOwnerDesc')],
                ['principal', t(lang, 'modePrincipalTitle'), t(lang, 'modePrincipalDesc')],
                ['historical', t(lang, 'modeHistoricalTitle'), t(lang, 'modeHistoricalDesc')],
                ['scenario', t(lang, 'modeScenarioTitle'), t(lang, 'modeScenarioDesc')],
                ['sandbox', t(lang, 'modeSandboxTitle'), t(lang, 'modeSandboxDesc')],
              ] as Array<[GameMode, string, string]>
            ).map(([mKey, title, desc]) => (
              <button
                key={mKey}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedMode(mKey);
                  if (mKey === 'historical' && selectedYear === 2026) {
                    setSelectedYear(2004);
                  }
                }}
                className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                  selectedMode === mKey
                    ? 'bg-rose-600/15 border-rose-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-bold font-display">{title}</div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
                </div>
                <div className="mt-3 text-[11px] font-mono text-rose-400">
                  {selectedMode === mKey ? 'SEÇİLİ MOD' : 'Seçmek için tıkla'}
                </div>
              </button>
            ))}
          </div>

          {/* 2. Season Year (2000-2026) & Player Name */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Adınız / Takım Patronu Kimliğiniz
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Formula 1 Sezon Yılı (2000 – 2026):</span>
                  <span className="font-mono font-bold text-rose-400">{selectedYear} SEZONU</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={2026}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[2026, 2025, 2021, 2014, 2009, 2005, 2004, 2000].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-2.5 py-1 text-xs font-mono rounded ${
                        selectedYear === yr
                          ? 'bg-rose-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
              <div className="font-bold text-white text-sm font-display">
                {previewRegulations.eraNameTr}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-400">Motor Kuralları:</span> {previewRegulations.engineSpecTr}
                </div>
                <div>
                  <span className="text-slate-400">Puan Sistemi:</span>{' '}
                  <span className="font-mono">{previewRegulations.pointsSystem.join('-')}</span>
                </div>
                <div>
                  <span className="text-slate-400">Maliyet Sınırı (Cost Cap):</span>{' '}
                  <span className="font-mono">
                    {previewRegulations.costCapUsd
                      ? formatCurrency(previewRegulations.costCapUsd)
                      : 'Sınırsız Bütçe Dönemi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Yakıt İkmali & DRS:</span>{' '}
                  {previewRegulations.refuelingAllowed ? 'Yarış İçi Yakıt İkmali Serbest' : 'Yakıt İkmali Yasak'} ·{' '}
                  {previewRegulations.drsEnabled ? 'DRS Aktif' : 'DRS Yok'}
                </div>
              </div>
              <div className="text-slate-400 pt-1 border-t border-slate-800">
                Lastik Regülasyonu: {previewRegulations.tireRuleTr}
              </div>
            </div>
          </div>

          {/* 3. Scenario Selection OR Team Choice / Custom Team Builder */}
          {selectedMode === 'scenario' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-white font-display">
                Özel Senaryo Mücadelesi Seçin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      selectedScenarioId === sc.id
                        ? 'bg-rose-600/15 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-rose-400 mb-1">
                      <span>ZORLUK: {sc.difficulty.toUpperCase()}</span>
                      <span>{sc.seasonYear}</span>
                    </div>
                    <div className="text-sm font-bold text-white font-display">{sc.titleTr}</div>
                    <p className="text-xs text-slate-400 mt-1">{sc.subtitleTr}</p>
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400">
                      Hedef: {sc.objectiveTr}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white font-display">
                  {t(lang, 'selectOrCreateTeam')}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTeamChoiceMode('custom')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      teamChoiceMode === 'custom'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t(lang, 'createCustomTeam')}
                  </button>
                  <button
                    onClick={() => setTeamChoiceMode('existing')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      teamChoiceMode === 'existing'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t(lang, 'manageExistingTeam')}
                  </button>
                </div>
              </div>

              {teamChoiceMode === 'custom' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Takım Adı (Varsayılan: Senin Takımın)
                      </label>
                      <input
                        type="text"
                        value={customTeamName}
                        onChange={(e) => setCustomTeamName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Merkez (Headquarters)</label>
                      <input
                        type="text"
                        value={customHq}
                        onChange={(e) => setCustomHq(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Güç Ünitesi (Motor) Tedarikçisi</label>
                      <select
                        value={customEngine}
                        onChange={(e) => setCustomEngine(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
                      >
                        <option value="Ferrari">Ferrari ($17M / yıl)</option>
                        <option value="Mercedes">Mercedes-AMG HPP ($17.5M / yıl)</option>
                        <option value="Honda">Honda Racing RBPT ($16.5M / yıl)</option>
                        <option value="Red Bull Ford">Red Bull Ford Powertrains ($16M / yıl)</option>
                        <option value="Audi">Audi Factory Power ($18M / yıl)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Başlangıç Bütçesi ({formatCurrency(customBudget)})
                      </label>
                      <input
                        type="range"
                        min={45_000_000}
                        max={160_000_000}
                        step={5_000_000}
                        value={customBudget}
                        onChange={(e) => setCustomBudget(Number(e.target.value))}
                        className="w-full accent-rose-500 mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">1. Lider Pilot Seçimi</label>
                      <select
                        value={customLeadDriver}
                        onChange={(e) => setCustomLeadDriver(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
                      >
                        {previewDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.flag} {d.name} (Hız: {d.pace} · Maaş: {formatCurrency(d.contract.annualSalary)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">2. Pilot Seçimi</label>
                      <select
                        value={customSecondDriver}
                        onChange={(e) => setCustomSecondDriver(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
                      >
                        {previewDrivers
                          .filter((d) => d.id !== customLeadDriver)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.flag} {d.name} (Hız: {d.pace} · Maaş: {formatCurrency(d.contract.annualSalary)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <label className="block text-[11px] text-slate-400 mb-1">Ana Takım Rengi</label>
                        <input
                          type="color"
                          value={customPrimary}
                          onChange={(e) => setCustomPrimary(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <label className="block text-[11px] text-slate-400 mb-1">İkincil Şasi Rengi</label>
                        <input
                          type="color"
                          value={customSecondary}
                          onChange={(e) => setCustomSecondary(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <label className="block text-[11px] text-slate-400 mb-1">Vurgu & Kanat Rengi</label>
                        <input
                          type="color"
                          value={customAccent}
                          onChange={(e) => setCustomAccent(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live 3D Preview of Custom Team Car */}
                  <div className="lg:col-span-5 h-64 lg:h-auto rounded-xl overflow-hidden border border-slate-800 relative">
                    <ThreeCarAndTrack
                      mode="showroom"
                      livery={{
                        id: 'preview_custom',
                        name: customTeamName,
                        mainBodyColor: customPrimary,
                        secondaryColor: customSecondary,
                        accentColor: customAccent,
                        frontWingColor: customSecondary,
                        rearWingColor: customSecondary,
                        sidepodColor: customPrimary,
                        engineCoverColor: customSecondary,
                        noseColor: customPrimary,
                        floorColor: '#111827',
                        wheelCoverColor: customAccent,
                        haloColor: '#1e293b',
                        numberPanelColor: '#ffffff',
                        finish: 'metallic',
                        pattern: 'aeroFlow',
                        showCarbonAreas: true,
                        titleSponsorText: customTeamName.toUpperCase(),
                      }}
                    />
                    <div className="absolute bottom-2 left-2 pointer-events-none bg-slate-900/90 px-3 py-1 rounded text-xs font-mono text-white">
                      {customTeamName} · {customEngine} Güç Ünitesi
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {previewTeams.map((tm) => {
                    const tDrivers = previewDrivers.filter((d) => d.teamId === tm.id);
                    const perf = calculateTeamCarPerformance(tm);
                    return (
                      <button
                        key={tm.id}
                        onClick={() => setSelectedExistingTeamId(tm.id)}
                        className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                          selectedExistingTeamId === tm.id
                            ? 'bg-rose-600/15 border-rose-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <TeamLogoSvg logo={tm.logo} size={36} />
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {formatCurrency(tm.budget)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white font-display">{tm.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Motor: {tm.engineSupplier} · Hedef: İlk {tm.targetPosition}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-0.5">
                            {tDrivers.map((d) => (
                              <div key={d.id}>
                                {d.flag} {d.name} ({d.pace})
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Araç Gücü:</span>
                          <span className="text-rose-400 font-bold">{perf.overall}/100</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!career) return null;

  // ============================================================================
  // RENDER 3: LIVE RACE WEEKEND SCREEN
  // ============================================================================
  if (screen === 'RACE_WEEKEND') {
    return (
      <RaceWeekendView
        state={career}
        onUpdateSetup={(driverId, setup) => {
          setCareer((prev) =>
            prev
              ? {
                  ...prev,
                  carSetups: { ...prev.carSetups, [driverId]: setup },
                }
              : null
          );
        }}
        onCompleteRaceWeekend={handleCompleteRaceWeekend}
        onExitWithoutFinishing={() => setScreen('HQ')}
      />
    );
  }

  // ============================================================================
  // RENDER 4: HEADQUARTERS (HQ) & MANAGEMENT WORKSPACE
  // ============================================================================
  const playerTeam = career.teams.find((t) => t.id === career.playerTeamId)!;
  const playerDrivers = career.drivers.filter((d) => d.teamId === playerTeam.id);
  const playerStaff = career.staff.filter((s) => s.teamId === playerTeam.id);
  const carPerf = calculateTeamCarPerformance(playerTeam, career.staff);
  const nextCircuit = career.calendar[career.currentRoundIndex % career.calendar.length];
  const unreadInboxCount = career.inbox.filter((i) => !i.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-rose-500 text-white px-4 py-3 rounded-lg shadow-2xl text-xs font-medium">
          {toastMsg}
        </div>
      )}

      {/* Contract Negotiation Modal */}
      {negotiationTarget && (
        <NegotiationModal
          target={negotiationTarget.entity}
          isDriver={negotiationTarget.isDriver}
          playerTeam={playerTeam}
          allTeams={career.teams}
          seasonYear={career.seasonYear}
          onAcceptContract={handleAcceptNegotiatedContract}
          onClose={() => setNegotiationTarget(null)}
        />
      )}

      {/* Top Executive Command Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <TeamLogoSvg logo={playerTeam.logo} size={42} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight font-display">
                {playerTeam.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {career.seasonYear} Sezonu · Hafta {career.currentWeek}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Bütçe: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(playerTeam.budget)}</strong> · Cost Cap:{' '}
              {career.regulations.costCapUsd
                ? `${formatCurrency(playerTeam.costCapSpent)} / ${formatCurrency(career.regulations.costCapUsd)}`
                : 'Sınırsız'} · Yönetim Güveni: <strong className="text-rose-500">%{playerTeam.boardConfidence}</strong> · Araç Gücü: <strong>{carPerf.overall}/100</strong>
            </div>
          </div>
        </div>

        {/* Right Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-2.5 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
          >
            {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          </button>

          <button
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
          >
            {lang.toUpperCase()}
          </button>

          <button
            onClick={handleAdvanceWeek}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {t(lang, 'advanceWeek')} (H{career.currentWeek + 1})
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setScreen('RACE_WEEKEND');
            }}
            className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow transition-colors whitespace-nowrap"
          >
            {nextCircuit.flag} {nextCircuit.name} GP Hafta Sonuna Git
          </button>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar + Active Department View) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-3 flex lg:flex-col gap-1 overflow-x-auto shrink-0">
          {(
            [
              ['dashboard', `${t(lang, 'hqDashboard')} (${unreadInboxCount})`],
              ['drivers', t(lang, 'hqDrivers')],
              ['staff', `${t(lang, 'hqStaff')} (${playerStaff.length})`],
              ['cardev', t(lang, 'hqCarDev')],
              ['design', t(lang, 'hqDesignStudio')],
              ['facilities', t(lang, 'hqFacilities')],
              ['finance', t(lang, 'hqFinance')],
              ['transfer', t(lang, 'hqTransfer')],
              ['boardmedia', t(lang, 'hqBoardMedia')],
              ['standings', t(lang, 'hqStandings')],
              ['saves', t(lang, 'hqSaves')],
            ] as Array<[HqTab, string]>
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              onClick={() => {
                soundEngine.playClick();
                setHqTab(tabKey);
              }}
              className={`px-3.5 py-2.5 text-xs font-medium rounded-lg text-left transition-colors whitespace-nowrap shrink-0 ${
                hqTab === tabKey
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 hidden lg:block space-y-2">
            <button
              onClick={() => setScreen('TITLE')}
              className="w-full px-3 py-2 text-xs text-slate-500 hover:text-rose-400 text-left"
            >
              ← Başlangıç Ekranına Dön
            </button>
          </div>
        </aside>

        {/* Active Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: HQ DASHBOARD & INBOX EVENTS */}
          {hqTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Top KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Sıradaki Yarış (Tur {career.currentRoundIndex + 1}/{career.calendar.length})</div>
                  <div className="text-base font-bold font-display mt-1">
                    {nextCircuit.flag} {nextCircuit.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    {nextCircuit.laps} Tur · {nextCircuit.lengthKm} km · Yağmur Riski: %{nextCircuit.weatherRainChance}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Araç Mühendislik Paketi</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-rose-500 mt-1">
                    {carPerf.overall} / 100
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    Aero: {carPerf.aerodynamics} · Hız: {carPerf.straightLineSpeed} · Dayanıklılık: {carPerf.coolingAndReliability}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Nakit Bütçe & Cost Cap</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-500 mt-1">
                    {formatCurrency(playerTeam.budget)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    Harcama: {formatCurrency(playerTeam.costCapSpent)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Takımlar Şampiyonası Durumu</div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                    {playerTeam.seasonPoints} Puan
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Yönetim Hedefi: İlk {playerTeam.targetPosition} · Güven: %{playerTeam.boardConfidence}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Interactive Inbox & Dynamic Events */}
                <div className="lg:col-span-7 space-y-3">
                  <h2 className="text-base font-bold font-display">
                    Gelen Kutusu, Politik Olaylar & Kriz Masası ({career.inbox.length})
                  </h2>
                  {career.inbox.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        !item.read
                          ? 'bg-white dark:bg-slate-900 border-rose-500/50'
                          : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                        <span>
                          [{item.category}] · {item.dateStr}
                        </span>
                        {item.actionRequired && !item.resolvedChoiceId && (
                          <span className="text-rose-400 font-bold">KARAR BEKLİYOR</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold">{item.titleTr}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.bodyTr}
                      </p>

                      {item.choices && !item.resolvedChoiceId && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          {item.choices.map((ch) => (
                            <button
                              key={ch.id}
                              onClick={() => handleEventChoice(item, ch.id)}
                              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-rose-600/20 border border-slate-300 dark:border-slate-800 hover:border-rose-500 text-left text-xs transition-colors"
                            >
                              <div className="font-bold">{ch.labelTr}</div>
                              <div className="text-[11px] text-slate-400">{ch.effectSummaryTr}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right: 3D Showroom Mini-Preview & Active R&D / Rumors */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-white font-display">
                        {playerTeam.name} 3B Garaj Ön İzlemesi
                      </span>
                      <button
                        onClick={() => setHqTab('design')}
                        className="text-rose-400 hover:underline"
                      >
                        Tasarım Stüdyosunu Aç →
                      </button>
                    </div>
                    <div className="h-56">
                      <ThreeCarAndTrack
                        mode="showroom"
                        livery={playerTeam.livery}
                        helmet={playerDrivers[0]?.helmetDesign}
                      />
                    </div>
                  </div>

                  {/* Transfer & Paddock Rumors */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
                    <h3 className="text-sm font-bold font-display">Padok Dedikoduları & Rakip AI Hamleleri</h3>
                    {career.transferRumors.slice(0, 4).map((rum) => (
                      <div
                        key={rum.id}
                        className="p-2.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300"
                      >
                        {rum.textTr}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVERS, ROLES & HEALTH */}
          {hqTab === 'drivers' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Takım Pilotları, Kondisyon & Akademi Yönetimi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pilot rollerini sezon içinde değiştirebilir, sağlık/kondisyon durumunu izleyebilir ve sözleşme yenileyebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => setHqTab('transfer')}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg"
                >
                  Transfer Pazarından Pilot Ara
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {playerDrivers.map((drv) => (
                  <div
                    key={drv.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{drv.flag}</span>
                          <span className="text-lg font-bold font-display">
                            #{drv.number} {drv.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Yaş: {drv.age} · Kişilik: {drv.personality.join(' · ')}
                        </div>
                      </div>
                      <select
                        value={drv.role}
                        onChange={(e) => {
                          const newRole = e.target.value as DriverRole;
                          setCareer({
                            ...career,
                            drivers: career.drivers.map((d) =>
                              d.id === drv.id ? { ...d, role: newRole } : d
                            ),
                          });
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                      >
                        <option value="lead">1. Lider Pilot</option>
                        <option value="second">2. Pilot</option>
                        <option value="equal">Eşit Statü</option>
                        <option value="reserve">Yedek Pilot</option>
                        <option value="academy">Genç Akademi</option>
                      </select>
                    </div>

                    {/* Health & Fitness Banner */}
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        drv.healthStatus === 'healthy'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <div>
                        <strong>Sağlık & Kondisyon ({drv.fitness}%):</strong> {drv.healthNoteTr}
                      </div>
                      {drv.healthStatus !== 'healthy' && (
                        <button
                          onClick={() => {
                            setCareer({
                              ...career,
                              drivers: career.drivers.map((d) =>
                                d.id === drv.id
                                  ? {
                                      ...d,
                                      healthStatus: 'healthy',
                                      recoveryWeeksLeft: 0,
                                      fitness: 95,
                                      healthNoteTr: 'Özel tıbbi rehabilitasyon ile tam sağlığına kavuştu.',
                                    }
                                  : d
                              ),
                            });
                            notify(`${drv.name} özel tıbbi programla yarışa hazır hale getirildi.`);
                          }}
                          className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded shrink-0"
                        >
                          Tedavi Et
                        </button>
                      )}
                    </div>

                    {/* Skill Bars */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
                      {(
                        [
                          ['Saf Hız (Pace)', drv.pace],
                          ['Sıralama (Quali)', drv.qualifying],
                          ['Yarış Zekası (Racecraft)', drv.racecraft],
                          ['Lastik Koruma', drv.tireManagement],
                          ['Yağmur Yeteneği', drv.wetWeather],
                          ['İstikrar & Geri Bildirim', drv.consistency],
                        ] as Array<[string, number]>
                      ).map(([lbl, val]) => (
                        <div key={lbl} className="bg-slate-100 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-400 font-sans">{lbl}</span>
                            <span className="font-bold">{val}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="font-mono text-slate-400">
                        Maaş: <strong className="text-white">{formatCurrency(drv.contract.annualSalary)}/yıl</strong> · Bitiş: {drv.contract.expirationSeason}
                      </div>
                      <button
                        onClick={() => setNegotiationTarget({ entity: drv, isDriver: true })}
                        className="px-3.5 py-1.5 font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md"
                      >
                        Sözleşme Görüşmesi Yap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FULL STAFF & ORGANIZATIONAL DEPARTMENTS */}
          {hqTab === 'staff' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Organizasyon Şeması & Departman Personeli ({playerStaff.length} Kilit Personel)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Her mühendis ve departman yöneticisi Ar-Ge hızını, pit stop sürelerini, finansal verimliliği ve pilot gelişimini doğrudan etkiler.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['all', 'Tüm Departmanlar'],
                      ['executive', 'Üst Yönetim'],
                      ['technical', 'Teknik & Şasi'],
                      ['aerodynamics', 'Aerodinamik'],
                      ['engineering', 'Yarış & Strateji'],
                      ['pitcrew', 'Mekaniker & Pit'],
                      ['commercial', 'Ticari & Medya'],
                      ['medical', 'Tıp & Akademi'],
                    ] as const
                  ).map(([deptKey, lbl]) => (
                    <button
                      key={deptKey}
                      onClick={() => setStaffFilterDept(deptKey === 'medical' ? 'medical' : deptKey)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        staffFilterDept === deptKey
                          ? 'bg-rose-600 text-white font-semibold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerStaff
                  .filter((s) => staffFilterDept === 'all' || s.department === staffFilterDept)
                  .map((st) => (
                    <div
                      key={st.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono text-rose-400 font-bold">
                            {st.role.toUpperCase()}
                          </span>
                          <div className="text-sm font-bold text-white font-display mt-0.5">
                            {st.name}
                          </div>
                          <div className="text-slate-400">
                            {st.nationality} · Yaş {st.age} · {st.personality}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-sm text-emerald-400">
                          {st.technicalSkill}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-mono text-center bg-slate-950 p-2 rounded border border-slate-800">
                        <div>
                          <div className="text-[10px] text-slate-400">Teknik</div>
                          <div className="font-bold text-white">{st.technicalSkill}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Verimlilik</div>
                          <div className="font-bold text-white">{st.efficiency}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Moral</div>
                          <div className="font-bold text-emerald-400">%{st.morale}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="font-mono text-slate-400">
                          {formatCurrency(st.contract.annualSalary)}/yıl
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const bonus = 100_000;
                              setCareer({
                                ...career,
                                teams: career.teams.map((tm) =>
                                  tm.id === playerTeam.id ? { ...tm, budget: tm.budget - bonus } : tm
                                ),
                                staff: career.staff.map((item) =>
                                  item.id === st.id
                                    ? { ...item, morale: Math.min(100, item.morale + 12) }
                                    : item
                                ),
                              });
                              notify(`${st.name} için $100K performans primi ödendi (+12 Moral).`);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                          >
                            Prim Ver
                          </button>
                          <button
                            onClick={() => setNegotiationTarget({ entity: st, isDriver: false })}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded"
                          >
                            Sözleşme
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: CAR DEVELOPMENT & TECHNICAL DEPARTMENT */}
          {hqTab === 'cardev' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Ar-Ge, Rüzgar Tüneli & 12 Bileşenli Mühendislik Merkezi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Her yeni parça tasarımı zaman ve bütçe gerektirir. Agresif geliştirmeler daha yüksek performans sağlar ancak soğutma/dayanıklılık riski taşır.
                  </p>
                </div>
                <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
                  Rüzgar Tüneli: Seviye {playerTeam.facilities.windTunnel.level} · CFD: Seviye {playerTeam.facilities.cfdCenter.level}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(playerTeam.parts) as CarPartType[]).map((partKey) => {
                  const part = playerTeam.parts[partKey];
                  return (
                    <div
                      key={partKey}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <div className="text-sm font-bold text-white font-display">{part.nameTr}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Spec Seviye {part.level} · Yedek Stok: {part.spareCount} Adet · {part.weightKg} kg
                          </div>
                        </div>
                        <span className="px-2 py-1 font-mono font-bold bg-rose-600/20 text-rose-400 rounded">
                          {Math.round((part.aeroEfficiency + part.mechanicalGrip + part.powerOutput) / 3)}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                        <div>Aero/Downforce: <strong className="text-white">{part.downforce}</strong></div>
                        <div>Drag Azaltımı: <strong className="text-white">{part.dragReduction}</strong></div>
                        <div>Mekanik Tutunma: <strong className="text-white">{part.mechanicalGrip}</strong></div>
                        <div>Dayanıklılık: <strong className="text-emerald-400">%{part.reliability}</strong></div>
                      </div>

                      {part.inDevelopment ? (
                        <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-700/50 text-cyan-200 font-mono text-[11px]">
                          ÜRETİMDE: {part.inDevelopment.targetName} ({part.inDevelopment.weeksRemaining} Hafta Kaldı · Beklenen: +{part.inDevelopment.expectedGain})
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleStartPartRD(partKey, false)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition-colors"
                          >
                            Stand Ar-Ge ({formatCurrency(part.manufacturingCost)})
                          </button>
                          <button
                            onClick={() => handleStartPartRD(partKey, true)}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded transition-colors"
                          >
                            Agresif Ar-Ge ({formatCurrency(part.manufacturingCost * 1.45)})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: 3D TEAM DESIGN STUDIO */}
          {hqTab === 'design' && (
            <div className="h-[calc(100vh-140px)]">
              <DesignStudioView
                team={playerTeam}
                drivers={career.drivers}
                staff={career.staff}
                onUpdateTeam={(updatedTeam, updatedDrivers) => {
                  const next: CareerState = {
                    ...career,
                    teams: career.teams.map((tm) => (tm.id === updatedTeam.id ? updatedTeam : tm)),
                    drivers: updatedDrivers || career.drivers,
                  };
                  setCareer(next);
                  saveCareerToDb(next, true);
                  notify('Tasarım Stüdyosu ve mühendislik konsepti değişiklikleri kaydedildi!');
                }}
              />
            </div>
          )}

          {/* TAB 6: FACILITIES & INFRASTRUCTURE */}
          {hqTab === 'facilities' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <h2 className="text-xl font-bold font-display">
                Takım Tesisleri ve Fabrika Altyapısı (10 Departman Tesisi)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(playerTeam.facilities) as FacilityType[]).map((facKey) => {
                  const fac = playerTeam.facilities[facKey];
                  return (
                    <div
                      key={facKey}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white font-display">{fac.nameTr}</h3>
                          <span className="font-mono font-bold text-rose-400">
                            Seviye {fac.level} / 5
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">{fac.effectDescriptionTr}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800 font-mono">
                        <span className="text-slate-400">
                          Aylık Bakım: {formatCurrency(fac.maintenanceCostPerMonth)}
                        </span>
                        {fac.upgradeWeeksLeft > 0 ? (
                          <span className="text-cyan-400 font-bold">
                            İNŞAAT SÜRÜYOR ({fac.upgradeWeeksLeft} Hafta)
                          </span>
                        ) : fac.level < 5 ? (
                          <button
                            onClick={() => handleUpgradeFacility(facKey)}
                            className="px-3.5 py-1.5 font-sans font-bold bg-rose-600 hover:bg-rose-500 text-white rounded"
                          >
                            Seviye {fac.level + 1}’e Yükselt ({formatCurrency(fac.upgradeCost)})
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold">MAKSİMUM SEVİYE</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: FINANCE, SPONSORS & FIA COST CAP */}
          {hqTab === 'finance' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Sponsors & New Sponsor Catalog */}
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-base font-bold font-display">
                    Aktif Sponsor Sözleşmeleri ({playerTeam.sponsors.length})
                  </h3>
                  {playerTeam.sponsors.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{sp.name}</div>
                        <div className="text-slate-400">
                          {sp.sectorTr} · Konum: {sp.placementZone.toUpperCase()} · Hedef: İlk {sp.targetConstructorPos}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-emerald-400 font-bold">
                          {formatCurrency(sp.annualValue)}/yıl
                        </div>
                        <div className="text-slate-400">Memnuniyet: %{sp.satisfaction}</div>
                      </div>
                    </div>
                  ))}

                  <h3 className="text-base font-bold font-display pt-2">
                    Yeni Sponsorluk Teklifleri
                  </h3>
                  {SPONSOR_CATALOG.filter(
                    (cat) => !playerTeam.sponsors.some((s) => s.id === cat.id)
                  ).map((offer) => (
                    <div
                      key={offer.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{offer.name}</div>
                        <div className="text-slate-400">
                          {offer.sectorTr} · İmza Primi: {formatCurrency(offer.signingBonus)} · Yıllık:{' '}
                          {formatCurrency(offer.annualValue)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const updatedTeams = career.teams.map((tm) =>
                            tm.id === playerTeam.id
                              ? {
                                  ...tm,
                                  budget: tm.budget + offer.signingBonus,
                                  sponsors: [...tm.sponsors, offer],
                                }
                              : tm
                          );
                          setCareer({ ...career, teams: updatedTeams });
                          notify(`${offer.name} ile sponsorluk anlaşması imzalandı (+${formatCurrency(offer.signingBonus)} imza primi)!`);
                        }}
                        className="px-3.5 py-1.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                      >
                        Anlaşmayı İmzala
                      </button>
                    </div>
                  ))}
                </div>

                {/* Financial Ledger */}
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-base font-bold font-display">
                    Finansal Nakit Akışı & FIA Cost Cap Muhasebe Defteri
                  </h3>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                          <th className="p-2.5">Hafta</th>
                          <th className="p-2.5">Açıklama</th>
                          <th className="p-2.5 text-center">Cost Cap</th>
                          <th className="p-2.5 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {career.ledger.slice(0, 18).map((item) => (
                          <tr key={item.id}>
                            <td className="p-2.5 text-slate-400">H{item.week}</td>
                            <td className="p-2.5 font-sans text-slate-200">{item.descriptionTr}</td>
                            <td className="p-2.5 text-center">
                              {item.countsTowardCostCap ? 'Dahil' : 'Muaf'}
                            </td>
                            <td
                              className={`p-2.5 text-right font-bold ${
                                item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {item.amount >= 0 ? '+' : ''}
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: REALISTIC DRIVER & STAFF TRANSFER MARKET */}
          {hqTab === 'transfer' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Küresel Pilot ve Mühendis Transfer Pazarı
                  </h2>
                  <p className="text-xs text-slate-400">
                    Rakip takımların pilotlarına veya serbest (Free Agent) yıldızlara sözleşme teklif edin.
                  </p>
                </div>
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="Pilot veya personel ara..."
                  className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white w-64"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-rose-400 font-display">
                  PİLOT TRANSFER LİSTESİ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {career.drivers
                    .filter((d) =>
                      d.name.toLowerCase().includes(transferSearch.toLowerCase())
                    )
                    .map((drv) => {
                      const curTeam = career.teams.find((t) => t.id === drv.teamId);
                      return (
                        <div
                          key={drv.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white font-display">
                                {drv.flag} #{drv.number} {drv.name}
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                Hız: {drv.pace}
                              </span>
                            </div>
                            <div className="text-slate-400 mt-1">
                              Takım: {curTeam ? curTeam.name : 'Serbest (Free Agent)'} · Maaş:{' '}
                              {formatCurrency(drv.contract.annualSalary)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="font-mono text-[11px] text-slate-400">
                              Fesih: {drv.teamId ? formatCurrency(drv.contract.terminationClause) : '$0'}
                            </span>
                            <button
                              onClick={() => setNegotiationTarget({ entity: drv, isDriver: true })}
                              className="px-3 py-1.5 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded"
                            >
                              Müzakere Başlat
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-cyan-400 font-display">
                  ÜST DÜZEY MÜHENDİS & PERSONEL TRANSFER LİSTESİ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {career.staff
                    .filter(
                      (s) =>
                        s.teamId !== playerTeam.id &&
                        s.name.toLowerCase().includes(transferSearch.toLowerCase())
                    )
                    .slice(0, 15)
                    .map((st) => {
                      const curTeam = career.teams.find((t) => t.id === st.teamId);
                      return (
                        <div
                          key={st.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="text-[11px] font-mono text-cyan-400">{st.role}</div>
                            <div className="font-bold text-sm text-white mt-0.5">{st.name}</div>
                            <div className="text-slate-400">
                              {curTeam ? curTeam.name : 'Serbest Uzman'} · Yetenek: {st.technicalSkill}/100
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="font-mono text-slate-400">
                              {formatCurrency(st.contract.annualSalary)}/yıl
                            </span>
                            <button
                              onClick={() => setNegotiationTarget({ entity: st, isDriver: false })}
                              className="px-3 py-1.5 font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded"
                            >
                              Teklif Sun
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: BOARDROOM, INVESTORS, MEDIA & SANDBOX */}
          {hqTab === 'boardmedia' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Board & Investors */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white font-display">
                    Yönetim Kurulu & Yatırımcı İlişkileri (Güven: %{playerTeam.boardConfidence})
                  </h3>
                  <p className="text-slate-400">{playerTeam.longTermObjectiveTr}</p>
                  <div className="space-y-2">
                    {playerTeam.boardMembers.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white">{bm.name}</div>
                          <div className="text-slate-400">
                            {bm.roleTr} · Öncelik: {bm.priority.toUpperCase()} (Hisse: %{bm.stakePercent})
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          Güven %{bm.confidence}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (playerTeam.boardConfidence < 65) {
                        notify('Yönetim kurulu güveni düşük olduğu için ek sermaye talebi reddedildi.');
                        return;
                      }
                      const grant = 8_000_000;
                      setCareer({
                        ...career,
                        teams: career.teams.map((tm) =>
                          tm.id === playerTeam.id
                            ? {
                                ...tm,
                                budget: tm.budget + grant,
                                boardConfidence: tm.boardConfidence - 8,
                              }
                            : tm
                        ),
                      });
                      notify('Yatırımcılar Ar-Ge altyapısı için +$8.00M ek sermaye onayladı!');
                    }}
                    className="w-full py-2.5 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                  >
                    Yatırımcılardan Ek Sermaye ($8M) Talep Et
                  </button>
                </div>

                {/* Sandbox & Custom Regulation Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white font-display">
                    Sandbox & Özel Simülasyon Kuralları
                  </h3>
                  {(
                    [
                      ['unlimitedBudget', 'Sınırsız Takım Bütçesi'],
                      ['disableCostCap', 'FIA Cost Cap Denetimini Devre Dışı Bırak'],
                      ['noDriverInjuries', 'Pilot Hastalık ve Kondisyon Kayıplarını Kapat'],
                      ['noSacking', 'Yönetim Kurulu Görevden Alma Koruması'],
                    ] as const
                  ).map(([sKey, label]) => (
                    <label
                      key={sKey}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <span className="text-slate-200 font-medium">{label}</span>
                      <input
                        type="checkbox"
                        checked={career.sandboxSettings[sKey]}
                        onChange={(e) =>
                          setCareer({
                            ...career,
                            sandboxSettings: {
                              ...career.sandboxSettings,
                              [sKey]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-rose-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: CHAMPIONSHIP STANDINGS & CALENDAR */}
          {hqTab === 'standings' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Drivers Championship */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-white font-display">
                    {career.seasonYear} Pilotlar Dünya Şampiyonası Puan Durumu
                  </h3>
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">Sıra</th>
                        <th className="py-2">Pilot</th>
                        <th className="py-2">Galibiyet</th>
                        <th className="py-2 text-right">Puan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {[...career.drivers]
                        .filter((d) => d.teamId !== null)
                        .sort((a, b) => b.seasonPoints - a.seasonPoints || b.pace - a.pace)
                        .map((drv, idx) => (
                          <tr
                            key={drv.id}
                            className={
                              drv.teamId === playerTeam.id ? 'text-rose-400 font-bold' : 'text-slate-200'
                            }
                          >
                            <td className="py-2">P{idx + 1}</td>
                            <td className="py-2 font-sans">
                              {drv.flag} {drv.name}
                            </td>
                            <td className="py-2">{drv.seasonWins}</td>
                            <td className="py-2 text-right font-bold">{drv.seasonPoints}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Constructors Championship */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-white font-display">
                    {career.seasonYear} Takımlar (Constructors) Şampiyonası
                  </h3>
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">Sıra</th>
                        <th className="py-2">Takım</th>
                        <th className="py-2">Motor</th>
                        <th className="py-2 text-right">Puan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {[...career.teams]
                        .sort((a, b) => b.seasonPoints - a.seasonPoints || b.reputation - a.reputation)
                        .map((tm, idx) => (
                          <tr
                            key={tm.id}
                            className={
                              tm.id === playerTeam.id ? 'text-rose-400 font-bold' : 'text-slate-200'
                            }
                          >
                            <td className="py-2">P{idx + 1}</td>
                            <td className="py-2 font-sans">{tm.name}</td>
                            <td className="py-2 font-sans text-slate-400">{tm.engineSupplier}</td>
                            <td className="py-2 text-right font-bold">{tm.seasonPoints}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: SAVE SYSTEM & BACKUPS (INDEXEDDB) */}
          {hqTab === 'saves' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-lg font-bold text-white font-display">
                  IndexedDB Kayıt Yönetimi & JSON Yedekleme
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={customSaveNameInput}
                    onChange={(e) => setCustomSaveNameInput(e.target.value)}
                    placeholder="Kayıt Yuvası Adı..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    onClick={async () => {
                      const newSlotState: CareerState = {
                        ...career,
                        saveId: `manual_${Date.now()}`,
                        saveName: customSaveNameInput.trim() || career.saveName,
                      };
                      await saveCareerToDb(newSlotState, false);
                      await refreshSaveSlots();
                      notify(`"${newSlotState.saveName}" IndexedDB veritabanına kaydedildi.`);
                    }}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                  >
                    Yeni Slota Manuel Kaydet
                  </button>
                  <button
                    onClick={() => exportCareerBackupJson(career)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                  >
                    {t(lang, 'exportBackup')}
                  </button>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  {saveSlots.map((slot) => (
                    <div
                      key={slot.saveId}
                      className="flex items-center justify-between p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{slot.saveName}</div>
                        <div className="text-slate-400 font-mono">
                          {slot.teamName} · Sezon {slot.seasonYear} · Hafta {slot.currentWeek} ·{' '}
                          {new Date(slot.lastSavedIso).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadSlot(slot.saveId)}
                          className="px-3 py-1.5 font-bold bg-slate-800 hover:bg-rose-600 text-white rounded"
                        >
                          Bu Kaydı Yükle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
