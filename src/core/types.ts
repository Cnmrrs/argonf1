export type Language = 'tr' | 'en';
export type ThemeMode = 'dark' | 'light';

export type GameMode =
  | 'owner'        // Team Owner Career
  | 'principal'    // Team Principal Career
  | 'historical'   // Historical Season Mode (2000-2026)
  | 'scenario'     // Scenario Mode
  | 'sandbox';     // Sandbox Mode

export type DriverRole =
  | 'lead'         // Birinci Pilot
  | 'second'       // İkinci Pilot
  | 'equal'        // Eşit Statü
  | 'reserve'      // Yedek Pilot
  | 'development'  // Gelişim Pilotu
  | 'academy';     // Genç Akademi Pilotu

export type DriverHealthStatus =
  | 'healthy'      // Tam Sağlıklı
  | 'fatigued'     // Yorgun (%5 performans kaybı)
  | 'illness'      // Rahatsızlık (Hafta sonu şüpheli)
  | 'recovering'   // Rehabilitasyon sürecinde
  | 'unavailable'; // Tıbbi olarak yarışamaz

export type PersonalityTrait =
  | 'Aggressive'
  | 'Calm'
  | 'Ambitious'
  | 'Loyal'
  | 'Competitive'
  | 'Diplomatic'
  | 'Impatient'
  | 'Media-conscious'
  | 'Team-oriented'
  | 'Financially motivated';

export type StaffDepartment =
  | 'executive'
  | 'technical'
  | 'aerodynamics'
  | 'engineering'
  | 'pitcrew'
  | 'commercial'
  | 'medical'
  | 'academy';

export type StaffRole =
  | 'Team Owner'
  | 'Team Principal'
  | 'Sporting Director'
  | 'Technical Director'
  | 'Chief Aerodynamicist'
  | 'Head of Vehicle Performance'
  | 'Race Engineer'
  | 'Performance Engineer'
  | 'Strategy Engineer'
  | 'Data Engineer'
  | 'Chief Mechanic'
  | 'Pit Crew Specialist'
  | 'Operations Manager'
  | 'Commercial Director'
  | 'Marketing Manager'
  | 'Communications Head'
  | 'Financial Controller'
  | 'Academy Director'
  | 'Chief Medical & Fitness Officer';

export interface ContractTerms {
  annualSalary: number;          // USD per year
  durationYears: number;         // 1 - 5 years
  expirationSeason: number;      // e.g. 2027
  signingBonus: number;
  winBonus: number;
  championshipBonus: number;
  terminationClause: number;     // Buyout / severance cost
  extensionOption: boolean;
  annualRaisePercent: number;
  confidentialityClause: boolean;
  gardeningLeaveMonths: number;  // 0, 3, 6, 12 months for staff
  guaranteedRole?: DriverRole;
  teamOrdersClause?: 'obey' | 'equal' | 'priority';
  mediaObligations?: 'low' | 'standard' | 'high';
}

export interface DriverEntity {
  id: string;
  name: string;
  age: number;
  nationality: string;
  flag: string;
  number: number;
  teamId: string | null; // null = Free Agent
  role: DriverRole;
  careerWins: number;
  careerPodiums: number;
  careerChampionships: number;
  experience: number;       // 1-100
  pace: number;             // 1-100
  racecraft: number;        // 1-100
  qualifying: number;       // 1-100
  wetWeather: number;       // 1-100
  tireManagement: number;   // 1-100
  consistency: number;      // 1-100
  adaptability: number;     // 1-100
  feedback: number;         // 1-100
  fitness: number;          // 1-100
  morale: number;           // 1-100
  confidence: number;       // 1-100
  reputation: number;       // 1-100
  marketValue: number;      // USD
  healthStatus: DriverHealthStatus;
  recoveryWeeksLeft: number;
  healthNoteTr: string;
  healthNoteEn: string;
  personality: PersonalityTrait[];
  teammateRelationship: number;    // 0-100
  managementRelationship: number;  // 0-100
  prefersPersonalHelmet: boolean;
  helmetDesign: HelmetDesign;
  contract: ContractTerms;
  seasonPoints: number;
  seasonWins: number;
  seasonPodiums: number;
  seasonDnfs: number;
}

export interface StaffEntity {
  id: string;
  name: string;
  age: number;
  nationality: string;
  department: StaffDepartment;
  role: StaffRole;
  teamId: string | null;
  experience: number;       // 1-100
  technicalSkill: number;   // 1-100
  leadership: number;       // 1-100
  efficiency: number;       // 1-100
  potential: number;        // 1-100
  reputation: number;       // 1-100
  morale: number;           // 1-100
  loyalty: number;          // 1-100
  ambition: number;         // 1-100
  managementRelationship: number; // 1-100
  personality: PersonalityTrait;
  onGardeningLeaveUntilWeek: number;
  contract: ContractTerms;
}

export type CarPartType =
  | 'frontWing'
  | 'rearWing'
  | 'floor'
  | 'diffuser'
  | 'sidepods'
  | 'chassis'
  | 'suspension'
  | 'brakes'
  | 'cooling'
  | 'engine'
  | 'ers'
  | 'gearbox';

export type CarConceptType =
  | 'balanced'
  | 'highDownforce'
  | 'lowDrag'
  | 'tireFriendly'
  | 'highSpeed';

export interface CarPartSpec {
  type: CarPartType;
  nameTr: string;
  nameEn: string;
  level: number;
  aeroEfficiency: number;    // 1-100
  downforce: number;         // 1-100
  dragReduction: number;     // 1-100 (higher = less drag)
  mechanicalGrip: number;    // 1-100
  coolingEfficiency: number; // 1-100
  tirePreservation: number;  // 1-100
  powerOutput: number;       // 1-100
  reliability: number;       // 1-100
  weightKg: number;          // component weight contribution
  manufacturingCost: number;
  spareCount: number;
  inDevelopment?: {
    targetName: string;
    weeksRemaining: number;
    totalWeeks: number;
    expectedGain: number;
    riskFactor: number;
    costAllocated: number;
  };
}

export type FacilityType =
  | 'factory'
  | 'windTunnel'
  | 'cfdCenter'
  | 'simulator'
  | 'driverAcademy'
  | 'rdCenter'
  | 'pitTraining'
  | 'fitnessMedical'
  | 'marketingHQ'
  | 'dataCenter';

export interface FacilityItem {
  type: FacilityType;
  nameTr: string;
  nameEn: string;
  level: number;           // 1 - 5
  condition: number;       // 0 - 100%
  maintenanceCostPerMonth: number;
  upgradeCost: number;
  upgradeWeeksLeft: number;
  effectDescriptionTr: string;
  effectDescriptionEn: string;
}

export interface SponsorContract {
  id: string;
  name: string;
  sectorTr: string;
  sectorEn: string;
  tier: 'title' | 'primary' | 'secondary';
  annualValue: number;
  signingBonus: number;
  durationYears: number;
  targetConstructorPos: number;
  satisfaction: number; // 0-100
  placementZone: 'sidepod' | 'rearWing' | 'frontWing' | 'halo' | 'engineCover';
  primaryColor: string;
}

export interface BoardMember {
  id: string;
  name: string;
  roleTr: string;
  roleEn: string;
  priority: 'championship' | 'profitability' | 'brandGrowth' | 'innovation';
  confidence: number; // 0-100
  stakePercent: number;
}

export interface LogoLayer {
  id: string;
  type: 'shape' | 'text' | 'symbol';
  content: string; // 'shield' | 'hexagon' | 'circle' | 'diamond' | 'wing' | 'star' | 'bolt' | 'crown' | custom text
  color: string;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface LogoDesign {
  id: string;
  name: string;
  bgShape: 'shield' | 'hexagon' | 'circle' | 'crest' | 'octagon' | 'none';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  shadowEnabled: boolean;
  initials: string;
  fontStyle: 'display' | 'mono' | 'sans';
  symbol: 'wing' | 'bolt' | 'star' | 'turbine' | 'chequered' | 'crescent' | 'falcon';
  layers: LogoLayer[];
  customImageDataUrl?: string;
}

export type SurfaceFinish = 'gloss' | 'matte' | 'metallic' | 'carbon';
export type LiveryPattern = 'stripes' | 'chevron' | 'split' | 'aeroFlow' | 'minimal';

export interface LiveryDesign {
  id: string;
  name: string;
  mainBodyColor: string;
  secondaryColor: string;
  accentColor: string;
  frontWingColor: string;
  rearWingColor: string;
  sidepodColor: string;
  engineCoverColor: string;
  noseColor: string;
  floorColor: string;
  wheelCoverColor: string;
  haloColor: string;
  numberPanelColor: string;
  finish: SurfaceFinish;
  pattern: LiveryPattern;
  showCarbonAreas: boolean;
  titleSponsorText: string;
}

export interface HelmetDesign {
  baseColor: string;
  stripeColor: string;
  visorTint: string;
  pattern: 'classic' | 'rays' | 'chevron' | 'halves';
  numberVisible: boolean;
  flagBadge: string;
}

export interface UniformDesign {
  suitPrimaryColor: string;
  suitSecondaryColor: string;
  suitAccentColor: string;
  gloveColor: string;
  shoeColor: string;
  capColor: string;
  pitCrewStyle: 'highVis' | 'stealth' | 'classic';
}

export interface GarageDesign {
  wallColor: string;
  floorFinish: 'epoxyGloss' | 'carbonTile' | 'brushedSteel';
  lightingColor: string;
  pitWallTheme: string;
  trophyCabinetLevel: number;
}

export interface TeamEntity {
  id: string;
  name: string;
  shortName: string;
  nationality: string;
  headquarters: string;
  isCustomTeam: boolean;
  ownerName: string;
  principalName: string;
  engineSupplier: string;
  engineCostPerSeason: number;
  budget: number;                // Current cash balance USD
  costCapSpent: number;          // Spent under FIA Cost Cap
  annualOperatingCost: number;
  debt: number;
  reputation: number;            // 1-100
  fanbaseMillions: number;
  historicalTitles: number;
  longTermObjectiveTr: string;
  longTermObjectiveEn: string;
  targetPosition: number;
  aiStrategyProfile: 'aggressiveR&D' | 'balanced' | 'financialPrudence' | 'starDriverFocus' | 'shortTermRisk';
  carConcept: CarConceptType;
  parts: Record<CarPartType, CarPartSpec>;
  facilities: Record<FacilityType, FacilityItem>;
  sponsors: SponsorContract[];
  boardMembers: BoardMember[];
  boardConfidence: number;       // 0-100
  logo: LogoDesign;
  livery: LiveryDesign;
  uniform: UniformDesign;
  garage: GarageDesign;
  savedLiveries: LiveryDesign[];
  savedLogos: LogoDesign[];
  seasonPoints: number;
  seasonWins: number;
  seasonPodiums: number;
}

export interface SeasonRegulations {
  year: number;
  eraNameTr: string;
  eraNameEn: string;
  engineSpecTr: string;
  engineSpecEn: string;
  pointsSystem: number[];        // e.g. [25,18,15,12,10,8,6,4,2,1] or [10,6,4,3,2,1]
  fastestLapPoint: boolean;
  sprintRacesEnabled: boolean;
  costCapUsd: number | null;     // null for pre-2021 seasons
  refuelingAllowed: boolean;
  tireRuleTr: string;
  tireRuleEn: string;
  drsEnabled: boolean;
  activeAeroEnabled: boolean;
  ersLimitMj: number;
  isHistoricalApproximation?: boolean;
}

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  flag: string;
  city: string;
  lengthKm: number;
  laps: number;
  corners: number;
  drsZones: number;
  baseLapTimeSec: number;
  pitLossSec: number;
  overtakingDifficulty: number; // 1-100 (higher = harder like Monaco)
  tireWearMultiplier: number;   // 0.7 - 1.5
  downforceSensitivity: number; // 0.3 - 1.0
  powerSensitivity: number;     // 0.3 - 1.0
  weatherRainChance: number;    // 0 - 100%
  elevationDeltaM: number;
  waypoints: Array<{ x: number; z: number; camber?: number; sector: 1 | 2 | 3; isDrs?: boolean }>;
}

export type TireCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
export type PaceMode = 'conserve' | 'standard' | 'push' | 'qualifying' | 'attack';
export type ErsMode = 'harvest' | 'balanced' | 'overtake' | 'defend';
export type FuelMode = 'lean' | 'standard' | 'rich';
export type TrackStatus = 'GREEN' | 'YELLOW' | 'VSC' | 'SC' | 'RED';
export type WeatherCondition = 'DRY' | 'CLOUDY' | 'LIGHT_RAIN' | 'HEAVY_RAIN' | 'DRYING';

export interface CarSetup {
  frontWingAngle: number;   // 1 - 100
  rearWingAngle: number;    // 1 - 100
  antiRollBar: number;      // 1 - 100
  tirePressurePsi: number;  // 20 - 26
  brakeBiasRear: number;    // 50 - 65%
  setupConfidence: number;  // 0 - 100%
}

export interface LiveRaceCarState {
  driverId: string;
  driverName: string;
  driverShort: string;
  driverNumber: number;
  teamId: string;
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  position: number;
  gridPosition: number;
  currentLap: number;
  trackProgress: number;     // 0.0 to 1.0 around lap
  totalElapsedTime: number;  // seconds
  gapToLeader: number;       // seconds
  gapToAhead: number;        // seconds
  lastLapTime: number;
  bestLapTime: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  sector1Color: 'purple' | 'green' | 'yellow' | 'none';
  sector2Color: 'purple' | 'green' | 'yellow' | 'none';
  sector3Color: 'purple' | 'green' | 'yellow' | 'none';
  tireCompound: TireCompound;
  tireWear: number;          // 0-100% (100% = fresh, 0% = punctured)
  tireTempC: number;         // 70 - 135 C
  tireAgeLaps: number;
  fuelKg: number;
  ersBattery: number;        // 0-100%
  paceMode: PaceMode;
  ersMode: ErsMode;
  fuelMode: FuelMode;
  inPit: boolean;
  pitBoxTimer: number;
  pitStopsCount: number;
  requestedPitCompound: TireCompound | null;
  pitThisLap: boolean;
  status: 'RUNNING' | 'PIT' | 'OUT';
  dnfReason?: string;
  timePenaltySec: number;
  warningsTrackLimits: number;
  speedKmh: number;
  gear: number;
  rpm: number;
  drsActive: boolean;
  teamOrder: 'free' | 'holdPosition' | 'letTeammatePass' | 'defendHard';
}

export interface RadioMessage {
  id: string;
  lap: number;
  timestamp: string;
  senderName: string;
  senderRole: 'DRIVER' | 'ENGINEER' | 'PRINCIPAL' | 'RIVAL_RADIO' | 'FIA';
  teamId: string;
  teamColor: string;
  textTr: string;
  textEn: string;
  priority: 'normal' | 'urgent' | 'strategy';
}

export interface StewardIncident {
  id: string;
  lap: number;
  involvedDrivers: string[];
  typeTr: string;
  typeEn: string;
  decisionTr: string;
  decisionEn: string;
  penaltySec: number;
  resolved: boolean;
}

export interface InboxEvent {
  id: string;
  week: number;
  dateStr: string;
  category: 'BOARD' | 'TRANSFER' | 'TECHNICAL' | 'SPONSOR' | 'FIA' | 'MEDIA' | 'MEDICAL' | 'POLITICS';
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  read: boolean;
  actionRequired?: boolean;
  choices?: Array<{
    id: string;
    labelTr: string;
    labelEn: string;
    effectSummaryTr: string;
    effectSummaryEn: string;
    budgetDelta?: number;
    moraleDelta?: number;
    boardConfidenceDelta?: number;
    reputationDelta?: number;
  }>;
  resolvedChoiceId?: string;
}

export interface FinancialLedgerItem {
  id: string;
  week: number;
  category: 'SPONSOR' | 'PRIZE' | 'SALARY' | 'RD' | 'FACILITY' | 'ENGINE' | 'LOGISTICS' | 'INVESTOR';
  descriptionTr: string;
  descriptionEn: string;
  amount: number; // positive = income, negative = expense
  countsTowardCostCap: boolean;
}

export interface CareerState {
  saveId: string;
  saveName: string;
  lastSavedIso: string;
  gameMode: GameMode;
  scenarioId?: string;
  seasonYear: number;
  currentWeek: number;       // 1 - 24
  currentRoundIndex: number; // index in calendar
  playerTeamId: string;
  playerName: string;
  regulations: SeasonRegulations;
  teams: TeamEntity[];
  drivers: DriverEntity[];
  staff: StaffEntity[];
  calendar: CircuitData[];
  inbox: InboxEvent[];
  ledger: FinancialLedgerItem[];
  carSetups: Record<string, CarSetup>; // keyed by driverId
  transferRumors: Array<{
    id: string;
    week: number;
    textTr: string;
    textEn: string;
  }>;
  seasonHistory: Array<{
    year: number;
    championDriver: string;
    championTeam: string;
    playerTeamPos: number;
    playerPoints: number;
  }>;
  sandboxSettings: {
    unlimitedBudget: boolean;
    disableCostCap: boolean;
    noDriverInjuries: boolean;
    noSacking: boolean;
    customWearMultiplier: number;
  };
}
