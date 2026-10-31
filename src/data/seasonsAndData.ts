import {
  BoardMember,
  CarConceptType,
  CarPartSpec,
  CarPartType,
  CareerState,
  CircuitData,
  DriverEntity,
  FacilityItem,
  FacilityType,
  GameMode,
  LogoDesign,
  LiveryDesign,
  SeasonRegulations,
  SponsorContract,
  StaffEntity,
  TeamEntity,
} from '../core/types';

export interface ScenarioDefinition {
  id: string;
  titleTr: string;
  titleEn: string;
  subtitleTr: string;
  subtitleEn: string;
  difficulty: 'Orta' | 'Zor' | 'Ekstrem';
  seasonYear: number;
  recommendedTeamId: string;
  budgetOverride?: number;
  debtOverride?: number;
  leadDriverDeparted?: boolean;
  objectiveTr: string;
  objectiveEn: string;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'save_bankrupt',
    titleTr: 'İflasın Eşiğinden Dönüş',
    titleEn: 'Saving a Financially Struggling Team',
    subtitleTr: 'Kasada yalnızca $14M kaldı, $38M borç var ve sponsorlar ayrılmak üzere.',
    subtitleEn: 'Only $14M cash left, $38M debt, and sponsors threatening termination.',
    difficulty: 'Ekstrem',
    seasonYear: 2026,
    recommendedTeamId: 'alpine',
    budgetOverride: 14_000_000,
    debtOverride: 38_000_000,
    objectiveTr: 'Sezonu pozitif nakit akışıyla tamamla ve Takımlar Şampiyonasında ilk 7’ye gir.',
    objectiveEn: 'Finish the season with positive cash flow and P7 or better in Constructors.',
  },
  {
    id: 'rebuild_dynasty',
    titleTr: 'Efsaneyi Yeniden İnşa Et',
    titleEn: 'Rebuilding a Former Champion',
    subtitleTr: 'Tarihi şampiyonluklarla dolu bir fabrika, ancak rüzgar tüneli ve şasi rakiplerin gerisinde.',
    subtitleEn: 'A historic powerhouse suffering from outdated wind tunnel and aero deficit.',
    difficulty: 'Zor',
    seasonYear: 2026,
    recommendedTeamId: 'williams',
    objectiveTr: '2 sezon içinde yarış podyumu elde et ve rüzgar tünelini Seviye 4’e çıkar.',
    objectiveEn: 'Score a podium finish and upgrade the Wind Tunnel to Level 4.',
  },
  {
    id: 'star_departure',
    titleTr: 'Lider Pilotun Şok Ayrılığı',
    titleEn: 'Managing After Lead Driver Leaves',
    subtitleTr: 'Sezon başlamadan hemen önce birinci pilotunuz rakip takıma geçti. Kriz masası kuruldu.',
    subtitleEn: 'Your number-one driver triggered a release clause days before Round 1.',
    difficulty: 'Zor',
    seasonYear: 2026,
    recommendedTeamId: 'mercedes',
    leadDriverDeparted: true,
    objectiveTr: 'Yedek pilot veya acil transferle Takımlar Şampiyonasında ilk 3’te kal.',
    objectiveEn: 'Recruit a replacement or promote a reserve to stay Top 3 in Constructors.',
  },
  {
    id: 'disastrous_recovery',
    titleTr: 'Felaket Sezonun Ardından',
    titleEn: 'Recovering from a Disastrous Season',
    subtitleTr: 'Yönetim kurulu güveni %35 seviyesinde ve dayanıklılık sorunları hat safhada.',
    subtitleEn: 'Board confidence is at 35% and power unit reliability is critical.',
    difficulty: 'Zor',
    seasonYear: 2026,
    recommendedTeamId: 'aston_martin',
    objectiveTr: 'Dayanıklılığı %85 üzerine çıkar ve yönetim kurulu güvenini %75’e yükselt.',
    objectiveEn: 'Raise reliability above 85% and restore board confidence to 75%.',
  },
  {
    id: 'limited_budget_war',
    titleTr: 'Kısıtlı Bütçe Mucizesi',
    titleEn: 'Competing with a Limited Budget',
    subtitleTr: 'Dev üreticilere karşı $42M bütçeyle her kuruşun hesabını yaparak puan mücadelesi verin.',
    subtitleEn: 'Fight factory giants with a lean $42M operating budget.',
    difficulty: 'Orta',
    seasonYear: 2026,
    recommendedTeamId: 'haas',
    budgetOverride: 42_000_000,
    objectiveTr: 'Maliyet sınırını aşmadan en az 35 şampiyona puanı topla.',
    objectiveEn: 'Score at least 35 points without breaching financial targets.',
  },
  {
    id: 'custom_from_scratch',
    titleTr: 'Sıfırdan 11. Takım: Senin Takımın',
    titleEn: 'Developing a New Team from Scratch',
    subtitleTr: 'Seviye 1 tesisler ve genç kadroyla gride 11. takım olarak katılın.',
    subtitleEn: 'Enter the Formula 1 grid as the 11th team with Level 1 facilities.',
    difficulty: 'Ekstrem',
    seasonYear: 2026,
    recommendedTeamId: 'custom_team',
    budgetOverride: 55_000_000,
    objectiveTr: 'İlk sezonda ilk puanlarını al ve Ar-Ge merkezini geliştir.',
    objectiveEn: 'Score your maiden championship points and upgrade the R&D center.',
  },
];

export function getRegulationsForYear(year: number): SeasonRegulations {
  if (year >= 2026) {
    return {
      year,
      eraNameTr: '2026 Aktif Aerodinami & %50 Elektrikli Güç Ünitesi Dönemi',
      eraNameEn: '2026 Active Aerodynamics & 50/50 Electric Power Unit Era',
      engineSpecTr: '1.6L V6 Turbo Hibrit (350kW MGU-K, %100 Sürdürülebilir Yakıt)',
      engineSpecEn: '1.6L V6 Turbo Hybrid (350kW MGU-K, 100% Sustainable Fuel)',
      pointsSystem: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastestLapPoint: false,
      sprintRacesEnabled: true,
      costCapUsd: 215_000_000,
      refuelingAllowed: false,
      tireRuleTr: '18 inç Pirelli slick lastikler (Kuru yarışta en az 2 farklı hamur zorunlu)',
      tireRuleEn: '18-inch Pirelli slicks (Minimum 2 compounds required in dry race)',
      drsEnabled: true,
      activeAeroEnabled: true,
      ersLimitMj: 8.5,
      isHistoricalApproximation: false,
    };
  }
  if (year >= 2021) {
    return {
      year,
      eraNameTr: `${year} Yer Etkisi (Ground Effect) & Cost Cap Dönemi`,
      eraNameEn: `${year} Ground Effect & FIA Cost Cap Era`,
      engineSpecTr: '1.6L V6 Turbo Hibrit (MGU-K + MGU-H)',
      engineSpecEn: '1.6L V6 Turbo Hybrid (MGU-K + MGU-H)',
      pointsSystem: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastestLapPoint: year <= 2024,
      sprintRacesEnabled: true,
      costCapUsd: year === 2021 ? 145_000_000 : 135_000_000,
      refuelingAllowed: false,
      tireRuleTr: year >= 2022 ? '18 inç Pirelli slick lastikler' : '13 inç Pirelli yüksek aşınmalı slick lastikler',
      tireRuleEn: year >= 2022 ? '18-inch Pirelli slicks' : '13-inch Pirelli slicks',
      drsEnabled: true,
      activeAeroEnabled: false,
      ersLimitMj: 4.0,
      isHistoricalApproximation: year !== 2021 && year !== 2025,
    };
  }
  if (year >= 2014) {
    return {
      year,
      eraNameTr: `${year} V6 Turbo Hibrit Güç Ünitesi Dönemi`,
      eraNameEn: `${year} V6 Turbo Hybrid Power Unit Era`,
      engineSpecTr: '1.6L V6 Turbo Hibrit + ERS (15.000 RPM)',
      engineSpecEn: '1.6L V6 Turbo Hybrid + ERS (15,000 RPM)',
      pointsSystem: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastestLapPoint: year >= 2019,
      sprintRacesEnabled: false,
      costCapUsd: null, // Sınırsız bütçe dönemi
      refuelingAllowed: false,
      tireRuleTr: '13 inç Pirelli slick lastikler (Kuru yarışta 2 hamur zorunluluğu)',
      tireRuleEn: '13-inch Pirelli slicks (2 compounds mandatory in dry race)',
      drsEnabled: true,
      activeAeroEnabled: false,
      ersLimitMj: 4.0,
      isHistoricalApproximation: year !== 2014,
    };
  }
  if (year >= 2009) {
    return {
      year,
      eraNameTr: `${year} Atmosferik V8, Slick Lastik & KERS Dönemi`,
      eraNameEn: `${year} Naturally Aspirated V8, Slicks & KERS Era`,
      engineSpecTr: '2.4L Atmosferik V8 (18.000 RPM Sınırı) + Opsiyonel KERS',
      engineSpecEn: '2.4L Naturally Aspirated V8 (18,000 RPM) + Optional KERS',
      pointsSystem: year === 2009 ? [10, 8, 6, 5, 4, 3, 2, 1] : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastestLapPoint: false,
      sprintRacesEnabled: false,
      costCapUsd: null,
      refuelingAllowed: year === 2009,
      tireRuleTr: year <= 2010 ? 'Bridgestone Potenza slick lastikler' : 'Pirelli yüksek aşınmalı slick lastikler',
      tireRuleEn: year <= 2010 ? 'Bridgestone Potenza slicks' : 'Pirelli high-degradation slicks',
      drsEnabled: year >= 2011,
      activeAeroEnabled: false,
      ersLimitMj: 0.4,
      isHistoricalApproximation: year !== 2009,
    };
  }
  // 2000 - 2008 V10 / Early V8 Era
  return {
    year,
    eraNameTr: `${year} Efsanevi ${year <= 2005 ? '3.0L V10' : '2.4L V8'}, Yakıt İkmali & Oluklu Lastik Dönemi`,
    eraNameEn: `${year} Iconic ${year <= 2005 ? '3.0L V10' : '2.4L V8'}, Refueling & Grooved Tire Era`,
    engineSpecTr: year <= 2005 ? '3.0L Atmosferik V10 (19.000 RPM)' : '2.4L Atmosferik V8 (19.000 RPM)',
    engineSpecEn: year <= 2005 ? '3.0L Naturally Aspirated V10 (19,000 RPM)' : '2.4L Naturally Aspirated V8 (19,000 RPM)',
    pointsSystem: year <= 2002 ? [10, 6, 4, 3, 2, 1] : [10, 8, 6, 5, 4, 3, 2, 1],
    fastestLapPoint: false,
    sprintRacesEnabled: false,
    costCapUsd: null,
    refuelingAllowed: true,
    tireRuleTr: year === 2005
      ? 'Oluklu lastikler (Bridgestone vs Michelin — Yarış boyunca lastik değişimi yasak!)'
      : '4 oluklu kuru zemin lastikleri (Bridgestone / Michelin lastik savaşı)',
    tireRuleEn: year === 2005
      ? 'Grooved tires (No tire changes permitted during race!)'
      : '4-grooved dry tires (Bridgestone / Michelin tire war)',
    drsEnabled: false,
    activeAeroEnabled: false,
    ersLimitMj: 0,
    isHistoricalApproximation: year !== 2004 && year !== 2000,
  };
}

function buildTrackLoop(
  points: Array<[number, number]>,
  drsIndices: number[] = [0, 5]
): CircuitData['waypoints'] {
  const total = points.length;
  return points.map(([x, z], idx) => {
    const ratio = idx / total;
    const sector: 1 | 2 | 3 = ratio < 0.33 ? 1 : ratio < 0.66 ? 2 : 3;
    return {
      x,
      z,
      sector,
      isDrs: drsIndices.includes(idx),
    };
  });
}

export const CIRCUITS_DATA: CircuitData[] = [
  {
    id: 'istanbul_park',
    name: 'Intercity İstanbul Park',
    country: 'Türkiye',
    flag: '🇹🇷',
    city: 'İstanbul (Tuzla)',
    lengthKm: 5.338,
    laps: 58,
    corners: 14,
    drsZones: 2,
    baseLapTimeSec: 84.8,
    pitLossSec: 21.5,
    overtakingDifficulty: 38,
    tireWearMultiplier: 1.32,
    downforceSensitivity: 0.78,
    powerSensitivity: 0.74,
    weatherRainChance: 28,
    elevationDeltaM: 46,
    waypoints: buildTrackLoop([
      [-80, -35], [-30, -45], [20, -40], [65, -25], [85, 5],
      [75, 42], [40, 55], [10, 48], [-15, 35], [-45, 52],
      [-78, 38], [-92, 10], [-88, -15],
    ], [0, 9]),
  },
  {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahreyn',
    flag: '🇧🇭',
    city: 'Sakhir',
    lengthKm: 5.412,
    laps: 57,
    corners: 15,
    drsZones: 3,
    baseLapTimeSec: 90.4,
    pitLossSec: 22.8,
    overtakingDifficulty: 32,
    tireWearMultiplier: 1.38,
    downforceSensitivity: 0.62,
    powerSensitivity: 0.82,
    weatherRainChance: 4,
    elevationDeltaM: 18,
    waypoints: buildTrackLoop([
      [-85, -40], [45, -42], [82, -20], [55, 10], [20, 5],
      [-10, 28], [45, 48], [78, 52], [-25, 55], [-75, 35],
      [-88, 0],
    ], [0, 6, 9]),
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monako',
    flag: '🇲🇨',
    city: 'Monte Carlo',
    lengthKm: 3.337,
    laps: 78,
    corners: 19,
    drsZones: 1,
    baseLapTimeSec: 71.6,
    pitLossSec: 19.5,
    overtakingDifficulty: 95,
    tireWearMultiplier: 0.72,
    downforceSensitivity: 0.98,
    powerSensitivity: 0.25,
    weatherRainChance: 22,
    elevationDeltaM: 42,
    waypoints: buildTrackLoop([
      [-65, -25], [-15, -38], [35, -35], [75, -18], [82, 12],
      [60, 28], [25, 22], [-5, 38], [-45, 42], [-72, 20],
      [-75, -5],
    ], [0]),
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'Birleşik Krallık',
    flag: '🇬🇧',
    city: 'Northamptonshire',
    lengthKm: 5.891,
    laps: 52,
    corners: 18,
    drsZones: 2,
    baseLapTimeSec: 87.2,
    pitLossSec: 20.4,
    overtakingDifficulty: 42,
    tireWearMultiplier: 1.42,
    downforceSensitivity: 0.88,
    powerSensitivity: 0.76,
    weatherRainChance: 45,
    elevationDeltaM: 15,
    waypoints: buildTrackLoop([
      [-70, -45], [10, -48], [60, -32], [85, -5], [70, 35],
      [35, 52], [-5, 45], [-35, 55], [-82, 32], [-90, -10],
    ], [2, 7]),
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belçika',
    flag: '🇧🇪',
    city: 'Stavelot',
    lengthKm: 7.004,
    laps: 44,
    corners: 19,
    drsZones: 2,
    baseLapTimeSec: 104.5,
    pitLossSec: 23.0,
    overtakingDifficulty: 28,
    tireWearMultiplier: 1.25,
    downforceSensitivity: 0.75,
    powerSensitivity: 0.90,
    weatherRainChance: 55,
    elevationDeltaM: 102,
    waypoints: buildTrackLoop([
      [-90, -35], [-45, -50], [25, -45], [85, -22], [92, 15],
      [60, 48], [15, 38], [-20, 52], [-65, 42], [-88, 8],
    ], [2, 8]),
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'İtalya',
    flag: '🇮🇹',
    city: 'Monza',
    lengthKm: 5.793,
    laps: 53,
    corners: 11,
    drsZones: 2,
    baseLapTimeSec: 80.2,
    pitLossSec: 24.2,
    overtakingDifficulty: 30,
    tireWearMultiplier: 0.88,
    downforceSensitivity: 0.32,
    powerSensitivity: 0.98,
    weatherRainChance: 18,
    elevationDeltaM: 12,
    waypoints: buildTrackLoop([
      [-92, -30], [35, -32], [85, -18], [90, 12], [45, 35],
      [-25, 38], [-85, 25], [-95, -5],
    ], [0, 5]),
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japonya',
    flag: '🇯🇵',
    city: 'Suzuka',
    lengthKm: 5.807,
    laps: 53,
    corners: 18,
    drsZones: 1,
    baseLapTimeSec: 89.8,
    pitLossSec: 22.5,
    overtakingDifficulty: 58,
    tireWearMultiplier: 1.36,
    downforceSensitivity: 0.92,
    powerSensitivity: 0.72,
    weatherRainChance: 38,
    elevationDeltaM: 40,
    waypoints: buildTrackLoop([
      [-80, -30], [-20, -45], [35, -25], [82, -35], [90, 10],
      [45, 45], [0, 20], [-40, 48], [-85, 22],
    ], [0]),
  },
  {
    id: 'interlagos',
    name: 'Autódromo José Carlos Pace (Interlagos)',
    country: 'Brezilya',
    flag: '🇧🇷',
    city: 'São Paulo',
    lengthKm: 4.309,
    laps: 71,
    corners: 15,
    drsZones: 2,
    baseLapTimeSec: 70.8,
    pitLossSec: 20.8,
    overtakingDifficulty: 34,
    tireWearMultiplier: 1.18,
    downforceSensitivity: 0.72,
    powerSensitivity: 0.78,
    weatherRainChance: 48,
    elevationDeltaM: 43,
    waypoints: buildTrackLoop([
      [-75, -38], [20, -42], [78, -18], [65, 25], [15, 18],
      [-15, 42], [35, 52], [-45, 50], [-82, 12],
    ], [1, 8]),
  },
];

export function createPartsForRating(baseRating: number): Record<CarPartType, CarPartSpec> {
  const clamp = (v: number) => Math.max(35, Math.min(99, Math.round(v)));
  const specs: Array<{ type: CarPartType; tr: string; en: string; weight: number; cost: number }> = [
    { type: 'frontWing', tr: 'Ön Kanat', en: 'Front Wing', weight: 14, cost: 450_000 },
    { type: 'rearWing', tr: 'Arka Kanat & DRS', en: 'Rear Wing & DRS', weight: 12, cost: 420_000 },
    { type: 'floor', tr: 'Taban & Venturi Kanalları', en: 'Underfloor & Venturi', weight: 28, cost: 850_000 },
    { type: 'diffuser', tr: 'Arka Difüzör', en: 'Rear Diffuser', weight: 11, cost: 520_000 },
    { type: 'sidepods', tr: 'Sidepod & Hava Girişleri', en: 'Sidepods & Inlets', weight: 19, cost: 640_000 },
    { type: 'chassis', tr: 'Karbon Monokok Şasi', en: 'Carbon Monocoque Chassis', weight: 52, cost: 1_200_000 },
    { type: 'suspension', tr: 'Ön/Arka Süspansiyon', en: 'Suspension Geometry', weight: 24, cost: 580_000 },
    { type: 'brakes', tr: 'Karbon Fren & Kanallar', en: 'Brake System & Ducts', weight: 10, cost: 340_000 },
    { type: 'cooling', tr: 'Radyatör & Soğutma', en: 'Thermal Cooling Pack', weight: 16, cost: 410_000 },
    { type: 'engine', tr: 'İçten Yanmalı Motor (ICE)', en: 'Internal Combustion Engine', weight: 95, cost: 1_500_000 },
    { type: 'ers', tr: 'ERS & Batarya Paketi', en: 'ERS & Energy Store', weight: 25, cost: 920_000 },
    { type: 'gearbox', tr: '8 İleri Karbon Şanzıman', en: '8-Speed Carbon Gearbox', weight: 38, cost: 740_000 },
  ];

  const out = {} as Record<CarPartType, CarPartSpec>;
  specs.forEach((s, idx) => {
    const offset = ((idx % 3) - 1) * 2;
    out[s.type] = {
      type: s.type,
      nameTr: s.tr,
      nameEn: s.en,
      level: 1,
      aeroEfficiency: clamp(baseRating + offset),
      downforce: clamp(baseRating + (idx % 2 === 0 ? 2 : -1)),
      dragReduction: clamp(baseRating - (idx % 2 === 0 ? 1 : -2)),
      mechanicalGrip: clamp(baseRating + offset),
      coolingEfficiency: clamp(baseRating),
      tirePreservation: clamp(baseRating - 1),
      powerOutput: clamp(baseRating + (s.type === 'engine' || s.type === 'ers' ? 3 : 0)),
      reliability: clamp(baseRating + 2),
      weightKg: s.weight,
      manufacturingCost: s.cost,
      spareCount: 3,
    };
  });
  return out;
}

export function createFacilitiesForLevel(baseLevel: number): Record<FacilityType, FacilityItem> {
  const lvl = Math.max(1, Math.min(5, baseLevel));
  const list: Array<{
    type: FacilityType;
    tr: string;
    en: string;
    maint: number;
    upCost: number;
    descTr: string;
    descEn: string;
  }> = [
    {
      type: 'factory',
      tr: 'Ana Üretim Fabrikası',
      en: 'Manufacturing Factory',
      maint: 180_000,
      upCost: 6_500_000,
      descTr: 'Yedek parça üretim hızını ve eşzamanlı Ar-Ge kapasitesini artırır.',
      descEn: 'Increases part manufacturing speed and parallel R&D capacity.',
    },
    {
      type: 'windTunnel',
      tr: 'Rüzgar Tüneli (Aero)',
      en: 'Wind Tunnel Facility',
      maint: 240_000,
      upCost: 9_200_000,
      descTr: 'Ön/arka kanat, taban ve sidepod aerodinamik verimlilik kazancını yükseltir.',
      descEn: 'Boosts aerodynamic development gains for wings, floor, and sidepods.',
    },
    {
      type: 'cfdCenter',
      tr: 'CFD Süper Bilgisayar Merkezi',
      en: 'CFD Compute Cluster',
      maint: 150_000,
      upCost: 5_400_000,
      descTr: 'Aerodinamik sürtünme (drag) azaltımı ve konsept araştırmasını hızlandırır.',
      descEn: 'Accelerates drag reduction research and next-season concept studies.',
    },
    {
      type: 'simulator',
      tr: 'Pilot Sürüş Simülatörü (DIL)',
      en: 'Driver-in-Loop Simulator',
      maint: 110_000,
      upCost: 4_200_000,
      descTr: 'Pilotların hafta sonu araç kurulum (setup) doğruluğunu ve adaptasyonunu artırır.',
      descEn: 'Improves race weekend setup confidence and driver track preparation.',
    },
    {
      type: 'driverAcademy',
      tr: 'Genç Pilot Akademisi',
      en: 'Young Driver Academy',
      maint: 95_000,
      upCost: 3_500_000,
      descTr: 'Yedek ve akademi pilotlarının haftalık yetenek gelişim hızını artırır.',
      descEn: 'Increases weekly skill progression of reserve and academy drivers.',
    },
    {
      type: 'rdCenter',
      tr: 'Ar-Ge & Şasi Tasarım Merkezi',
      en: 'R&D & Chassis Design Office',
      maint: 195_000,
      upCost: 7_000_000,
      descTr: 'Şasi, süspansiyon ve ağırlık azaltma projelerinin kalitesini yükseltir.',
      descEn: 'Enhances mechanical grip, suspension geometry, and weight reduction.',
    },
    {
      type: 'pitTraining',
      tr: 'Pit Ekibi Eğitim Merkezi',
      en: 'Pit Crew Training Center',
      maint: 75_000,
      upCost: 2_800_000,
      descTr: 'Pit stop sürelerini kısaltır (2.1 sn altı) ve hatalı bijon riskini düşürür.',
      descEn: 'Reduces pit stop stationary time and minimizes unsafe release errors.',
    },
    {
      type: 'fitnessMedical',
      tr: 'Tıp, Kondisyon & Rehabilitasyon Merkezi',
      en: 'Medical & Fitness Performance Lab',
      maint: 80_000,
      upCost: 3_100_000,
      descTr: 'Pilot yorgunluğunu önler ve hastalık/sakatlık iyileşme süresini kısaltır.',
      descEn: 'Prevents driver fatigue and accelerates recovery from illness or injury.',
    },
    {
      type: 'marketingHQ',
      tr: 'Ticari & Medya İletişim Merkezi',
      en: 'Commercial & Marketing Suite',
      maint: 90_000,
      upCost: 3_600_000,
      descTr: 'Sponsor memnuniyetini, ürün satış gelirlerini ve marka değerini büyütür.',
      descEn: 'Boosts sponsor satisfaction, merchandising income, and brand value.',
    },
    {
      type: 'dataCenter',
      tr: 'Canlı Telemetri & Strateji Veri Merkezi',
      en: 'Live Telemetry & Strategy Data Center',
      maint: 120_000,
      upCost: 4_800_000,
      descTr: 'Yarış içi hava tahmini doğruluğunu ve pit penceresi hesaplamalarını iyileştirir.',
      descEn: 'Improves weather forecast accuracy and undercut/overcut strategy calls.',
    },
  ];

  const out = {} as Record<FacilityType, FacilityItem>;
  list.forEach((f) => {
    out[f.type] = {
      type: f.type,
      nameTr: f.tr,
      nameEn: f.en,
      level: lvl,
      condition: 94,
      maintenanceCostPerMonth: f.maint * lvl,
      upgradeCost: f.upCost * lvl,
      upgradeWeeksLeft: 0,
      effectDescriptionTr: f.descTr,
      effectDescriptionEn: f.descEn,
    };
  });
  return out;
}

export function createDefaultLogo(
  initials: string,
  primary: string,
  secondary: string,
  accent: string,
  symbol: LogoDesign['symbol'] = 'wing'
): LogoDesign {
  return {
    id: `logo_${initials.toLowerCase()}`,
    name: `${initials} Resmi Amblem`,
    bgShape: 'shield',
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    gradientEnabled: true,
    borderColor: accent,
    borderWidth: 3,
    shadowEnabled: true,
    initials,
    fontStyle: 'display',
    symbol,
    layers: [
      { id: 'l1', type: 'shape', content: 'shield', color: primary, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
      { id: 'l2', type: 'symbol', content: symbol, color: accent, scale: 0.9, rotation: 0, offsetX: 0, offsetY: -10 },
      { id: 'l3', type: 'text', content: initials, color: '#ffffff', scale: 1, rotation: 0, offsetX: 0, offsetY: 18 },
    ],
  };
}

export function createDefaultLivery(
  name: string,
  main: string,
  secondary: string,
  accent: string,
  sponsorText: string
): LiveryDesign {
  return {
    id: `livery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    mainBodyColor: main,
    secondaryColor: secondary,
    accentColor: accent,
    frontWingColor: secondary,
    rearWingColor: secondary,
    sidepodColor: main,
    engineCoverColor: secondary,
    noseColor: main,
    floorColor: '#111827',
    wheelCoverColor: accent,
    haloColor: '#1e293b',
    numberPanelColor: '#ffffff',
    finish: 'metallic',
    pattern: 'aeroFlow',
    showCarbonAreas: true,
    titleSponsorText: sponsorText,
  };
}

export const SPONSOR_CATALOG: SponsorContract[] = [
  {
    id: 'sp_argon_tech',
    name: 'Argon Quantum Cloud',
    sectorTr: 'Yapay Zeka & Bulut Bilişim',
    sectorEn: 'AI & Cloud Computing',
    tier: 'title',
    annualValue: 28_000_000,
    signingBonus: 6_000_000,
    durationYears: 3,
    targetConstructorPos: 4,
    satisfaction: 85,
    placementZone: 'sidepod',
    primaryColor: '#e11d48',
  },
  {
    id: 'sp_bosphorus_air',
    name: 'Bosphorus Global Airlines',
    sectorTr: 'Havacılık & Lojistik',
    sectorEn: 'Aviation & Logistics',
    tier: 'title',
    annualValue: 24_500_000,
    signingBonus: 5_000_000,
    durationYears: 2,
    targetConstructorPos: 5,
    satisfaction: 88,
    placementZone: 'rearWing',
    primaryColor: '#ef4444',
  },
  {
    id: 'sp_anatolia_energy',
    name: 'Anatolia SynthFuel',
    sectorTr: 'Sürdürülebilir E-Yakıt',
    sectorEn: 'Sustainable E-Fuels',
    tier: 'primary',
    annualValue: 14_000_000,
    signingBonus: 2_500_000,
    durationYears: 2,
    targetConstructorPos: 6,
    satisfaction: 82,
    placementZone: 'engineCover',
    primaryColor: '#10b981',
  },
  {
    id: 'sp_chronos_swiss',
    name: 'Chronos Genève Horology',
    sectorTr: 'Lüks Saat & Kronometre',
    sectorEn: 'Luxury Horology',
    tier: 'primary',
    annualValue: 11_500_000,
    signingBonus: 2_000_000,
    durationYears: 3,
    targetConstructorPos: 7,
    satisfaction: 84,
    placementZone: 'halo',
    primaryColor: '#f59e0b',
  },
  {
    id: 'sp_apex_semi',
    name: 'Apex Silicon Semiconductors',
    sectorTr: 'Yarı İletken Teknolojileri',
    sectorEn: 'Semiconductors',
    tier: 'secondary',
    annualValue: 7_200_000,
    signingBonus: 1_200_000,
    durationYears: 1,
    targetConstructorPos: 8,
    satisfaction: 90,
    placementZone: 'frontWing',
    primaryColor: '#06b6d4',
  },
  {
    id: 'sp_valkyrie_cyber',
    name: 'Valkyrie CyberDefense',
    sectorTr: 'Siber Güvenlik',
    sectorEn: 'Cybersecurity',
    tier: 'secondary',
    annualValue: 6_400_000,
    signingBonus: 1_000_000,
    durationYears: 2,
    targetConstructorPos: 9,
    satisfaction: 86,
    placementZone: 'frontWing',
    primaryColor: '#8b5cf6',
  },
];

export function createDefaultCustomTeam(
  customName: string = 'Senin Takımın',
  primaryColor: string = '#e11d48',
  secondaryColor: string = '#0f172a',
  accentColor: string = '#38bdf8',
  engineSupplier: string = 'Ferrari',
  initialBudget: number = 85_000_000,
  facilityLevel: number = 3
): TeamEntity {
  const initials = customName
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 3) || 'STK';

  const logo = createDefaultLogo(initials, primaryColor, secondaryColor, accentColor, 'crescent');
  const livery = createDefaultLivery(`${customName} 2026 Livery`, primaryColor, secondaryColor, accentColor, customName.toUpperCase());

  const boardMembers: BoardMember[] = [
    { id: 'bm_1', name: 'Selim Karahan', roleTr: 'Yönetim Kurulu Başkanı', roleEn: 'Chairman of the Board', priority: 'championship', confidence: 85, stakePercent: 45 },
    { id: 'bm_2', name: 'Ceren Soylu', roleTr: 'Finansal Yatırım Ortaklığı Temsilcisi', roleEn: 'Lead Financial Investor', priority: 'profitability', confidence: 82, stakePercent: 35 },
    { id: 'bm_3', name: 'Dr. Dietrich Vance', roleTr: 'Teknoloji ve Marka Danışmanı', roleEn: 'Brand & Tech Partner', priority: 'brandGrowth', confidence: 88, stakePercent: 20 },
  ];

  return {
    id: 'custom_team',
    name: customName,
    shortName: initials,
    nationality: 'Türkiye',
    headquarters: 'İstanbul, Türkiye',
    isCustomTeam: true,
    ownerName: 'Oyuncu (Takım Sahibi)',
    principalName: 'Oyuncu (Takım Patronu)',
    engineSupplier,
    engineCostPerSeason: 17_000_000,
    budget: initialBudget,
    costCapSpent: 48_000_000,
    annualOperatingCost: 62_000_000,
    debt: 0,
    reputation: 74,
    fanbaseMillions: 18.5,
    historicalTitles: 0,
    longTermObjectiveTr: '3 sezon içinde düzenli podyum mücadelesi veren ve şampiyonluğa oynayan bağımsız bir fabrika takımına dönüşmek.',
    longTermObjectiveEn: 'Transform into a podium-contending championship force within 3 seasons.',
    targetPosition: 5,
    aiStrategyProfile: 'balanced',
    carConcept: 'balanced',
    parts: createPartsForRating(78 + (facilityLevel - 2) * 3),
    facilities: createFacilitiesForLevel(facilityLevel),
    sponsors: [SPONSOR_CATALOG[1], SPONSOR_CATALOG[2]],
    boardMembers,
    boardConfidence: 85,
    logo,
    livery,
    uniform: {
      suitPrimaryColor: primaryColor,
      suitSecondaryColor: secondaryColor,
      suitAccentColor: accentColor,
      gloveColor: accentColor,
      shoeColor: '#111827',
      capColor: primaryColor,
      pitCrewStyle: 'highVis',
    },
    garage: {
      wallColor: secondaryColor,
      floorFinish: 'epoxyGloss',
      lightingColor: accentColor,
      pitWallTheme: primaryColor,
      trophyCabinetLevel: 1,
    },
    savedLiveries: [livery],
    savedLogos: [logo],
    seasonPoints: 0,
    seasonWins: 0,
    seasonPodiums: 0,
  };
}

interface RawTeamSeed {
  id: string;
  name: string;
  shortName: string;
  nationality: string;
  hq: string;
  owner: string;
  principal: string;
  engine: string;
  budget: number;
  rep: number;
  titles: number;
  rating: number;
  facLevel: number;
  targetPos: number;
  primary: string;
  secondary: string;
  accent: string;
  strategy: TeamEntity['aiStrategyProfile'];
  concept: CarConceptType;
  objectiveTr: string;
}

const TEAMS_2026_SEED: RawTeamSeed[] = [
  {
    id: 'mclaren',
    name: 'McLaren Formula 1 Team',
    shortName: 'MCL',
    nationality: 'Birleşik Krallık',
    hq: 'Woking, Birleşik Krallık',
    owner: 'McLaren Group / Mumtalakat',
    principal: 'Andrea Stella',
    engine: 'Mercedes',
    budget: 142_000_000,
    rep: 95,
    titles: 9,
    rating: 93,
    facLevel: 5,
    targetPos: 1,
    primary: '#f97316',
    secondary: '#0f172a',
    accent: '#38bdf8',
    strategy: 'aggressiveR&D',
    concept: 'highDownforce',
    objectiveTr: 'Markalar ve Pilotlar Şampiyonluğunu kazanmak.',
  },
  {
    id: 'ferrari',
    name: 'Scuderia Ferrari HP',
    shortName: 'FER',
    nationality: 'İtalya',
    hq: 'Maranello, İtalya',
    owner: 'Exor N.V. / Ferrari N.V.',
    principal: 'Frédéric Vasseur',
    engine: 'Ferrari',
    budget: 155_000_000,
    rep: 98,
    titles: 16,
    rating: 92,
    facLevel: 5,
    targetPos: 1,
    primary: '#dc2626',
    secondary: '#111827',
    accent: '#facc15',
    strategy: 'starDriverFocus',
    concept: 'balanced',
    objectiveTr: 'Maranello’ya dünya şampiyonluğu kupasını geri getirmek.',
  },
  {
    id: 'red_bull',
    name: 'Oracle Red Bull Racing',
    shortName: 'RBR',
    nationality: 'Avusturya',
    hq: 'Milton Keynes, Birleşik Krallık',
    owner: 'Red Bull GmbH',
    principal: 'Laurent Mekies',
    engine: 'Red Bull Ford Powertrains',
    budget: 148_000_000,
    rep: 94,
    titles: 6,
    rating: 91,
    facLevel: 5,
    targetPos: 2,
    primary: '#1e3a8a',
    secondary: '#090d16',
    accent: '#ef4444',
    strategy: 'aggressiveR&D',
    concept: 'lowDrag',
    objectiveTr: 'Yeni güç ünitesi döneminde şampiyonluk mücadelesinin zirvesinde kalmak.',
  },
  {
    id: 'mercedes',
    name: 'Mercedes-AMG PETRONAS F1 Team',
    shortName: 'MER',
    nationality: 'Almanya',
    hq: 'Brackley, Birleşik Krallık',
    owner: 'Mercedes-Benz / INEOS / Toto Wolff',
    principal: 'Toto Wolff',
    engine: 'Mercedes',
    budget: 146_000_000,
    rep: 93,
    titles: 8,
    rating: 90,
    facLevel: 5,
    targetPos: 2,
    primary: '#0d9488',
    secondary: '#0f172a',
    accent: '#cbd5e1',
    strategy: 'balanced',
    concept: 'balanced',
    objectiveTr: '2026 motor kurallarıyla yeniden şampiyonluk hanedanlığı kurmak.',
  },
  {
    id: 'aston_martin',
    name: 'Aston Martin Aramco F1 Team',
    shortName: 'AMR',
    nationality: 'Birleşik Krallık',
    hq: 'Silverstone, Birleşik Krallık',
    owner: 'AMR GP Holdings / Lawrence Stroll',
    principal: 'Adrian Newey & Andy Cowell',
    engine: 'Honda',
    budget: 132_000_000,
    rep: 85,
    titles: 0,
    rating: 85,
    facLevel: 4,
    targetPos: 4,
    primary: '#047857',
    secondary: '#091512',
    accent: '#a3e635',
    strategy: 'aggressiveR&D',
    concept: 'highDownforce',
    objectiveTr: 'Honda fabrika motoru ve yeni rüzgar tüneliyle yarış galibiyetleri almak.',
  },
  {
    id: 'williams',
    name: 'Atlassian Williams Racing',
    shortName: 'WIL',
    nationality: 'Birleşik Krallık',
    hq: 'Grove, Birleşik Krallık',
    owner: 'Dorilton Capital',
    principal: 'James Vowles',
    engine: 'Mercedes',
    budget: 96_000_000,
    rep: 82,
    titles: 9,
    rating: 82,
    facLevel: 4,
    targetPos: 5,
    primary: '#2563eb',
    secondary: '#0f172a',
    accent: '#38bdf8',
    strategy: 'financialPrudence',
    concept: 'lowDrag',
    objectiveTr: 'Üst sıralara tırmanıp düzenli podyum adayı olmak.',
  },
  {
    id: 'alpine',
    name: 'BWT Alpine F1 Team',
    shortName: 'ALP',
    nationality: 'Fransa',
    hq: 'Enstone, Birleşik Krallık',
    owner: 'Renault Group / Otro Capital',
    principal: 'Flavio Briatore & Oliver Oakes',
    engine: 'Mercedes',
    budget: 88_000_000,
    rep: 76,
    titles: 2,
    rating: 79,
    facLevel: 3,
    targetPos: 6,
    primary: '#0284c7',
    secondary: '#1e1b4b',
    accent: '#ec4899',
    strategy: 'shortTermRisk',
    concept: 'balanced',
    objectiveTr: 'Orta grup liderliğini ele geçirip yeniden yapılanmayı tamamlamak.',
  },
  {
    id: 'audi',
    name: 'Audi F1 Factory Team (Sauber)',
    shortName: 'AUD',
    nationality: 'Almanya / İsviçre',
    hq: 'Hinwil & Neuburg',
    owner: 'AUDI AG',
    principal: 'Mattia Binotto & Jonathan Wheatley',
    engine: 'Audi',
    budget: 118_000_000,
    rep: 80,
    titles: 0,
    rating: 78,
    facLevel: 4,
    targetPos: 7,
    primary: '#ef4444',
    secondary: '#18181b',
    accent: '#a1a1aa',
    strategy: 'balanced',
    concept: 'tireFriendly',
    objectiveTr: 'İlk fabrika sezonunda dayanıklılığı oturtup ilk 6’ya girmek.',
  },
  {
    id: 'racing_bulls',
    name: 'Visa Cash App Racing Bulls',
    shortName: 'VRB',
    nationality: 'İtalya',
    hq: 'Faenza, İtalya',
    owner: 'Red Bull GmbH',
    principal: 'Peter Bayer & Alan Permane',
    engine: 'Red Bull Ford Powertrains',
    budget: 82_000_000,
    rep: 74,
    titles: 0,
    rating: 78,
    facLevel: 3,
    targetPos: 8,
    primary: '#3b82f6',
    secondary: '#ffffff',
    accent: '#ef4444',
    strategy: 'financialPrudence',
    concept: 'tireFriendly',
    objectiveTr: 'Genç pilotları yetiştirirken orta grupta istikrarlı puanlar toplamak.',
  },
  {
    id: 'haas',
    name: 'MoneyGram Haas F1 Team',
    shortName: 'HAA',
    nationality: 'ABD',
    hq: 'Kannapolis, ABD & Banbury',
    owner: 'Gene Haas',
    principal: 'Ayao Komatsu',
    engine: 'Ferrari',
    budget: 76_000_000,
    rep: 71,
    titles: 0,
    rating: 76,
    facLevel: 3,
    targetPos: 9,
    primary: '#e11d48',
    secondary: '#18181b',
    accent: '#f8fafc',
    strategy: 'financialPrudence',
    concept: 'highSpeed',
    objectiveTr: 'Verimli bütçe yönetimiyle her yarışta puan barajını zorlamak.',
  },
];

export function buildTeamsForSeason(year: number): TeamEntity[] {
  return TEAMS_2026_SEED.map((seed, idx) => {
    // Adjust historical team names accurately when playing classic eras
    let name = seed.name;
    let shortName = seed.shortName;
    let engine = seed.engine;
    if (year <= 2005) {
      if (seed.id === 'red_bull') { name = 'Jaguar Racing / Red Bull'; engine = 'Cosworth V10'; }
      if (seed.id === 'mercedes') { name = 'BAR Honda'; shortName = 'BAR'; engine = 'Honda V10'; }
      if (seed.id === 'alpine') { name = 'Mild Seven Renault F1 Team'; shortName = 'REN'; engine = 'Renault V10'; }
      if (seed.id === 'aston_martin') { name = 'Jordan Grand Prix'; shortName = 'JOR'; engine = 'Ford Cosworth V10'; }
      if (seed.id === 'audi') { name = 'Sauber Petronas'; shortName = 'SAU'; engine = 'Petronas V10'; }
      if (seed.id === 'racing_bulls') { name = 'Minardi F1 Team'; shortName = 'MIN'; engine = 'Cosworth V10'; }
      if (seed.id === 'haas') { name = 'Toyota Panasonic Racing'; shortName = 'TOY'; engine = 'Toyota V10'; }
      if (seed.id === 'williams') { name = 'BMW WilliamsF1 Team'; shortName = 'WIL'; engine = 'BMW V10'; }
    } else if (year === 2009) {
      if (seed.id === 'mercedes') { name = 'Brawn GP Formula One Team'; shortName = 'BGP'; engine = 'Mercedes V8'; }
      if (seed.id === 'alpine') { name = 'ING Renault F1 Team'; shortName = 'REN'; engine = 'Renault V8'; }
      if (seed.id === 'aston_martin') { name = 'Force India F1 Team'; shortName = 'FIN'; engine = 'Mercedes V8'; }
      if (seed.id === 'audi') { name = 'BMW Sauber F1 Team'; shortName = 'BMW'; engine = 'BMW V8'; }
      if (seed.id === 'racing_bulls') { name = 'Scuderia Toro Rosso'; shortName = 'STR'; engine = 'Ferrari V8'; }
      if (seed.id === 'haas') { name = 'Panasonic Toyota Racing'; shortName = 'TOY'; engine = 'Toyota V8'; }
    }

    const logo = createDefaultLogo(shortName, seed.primary, seed.secondary, seed.accent, 'wing');
    const livery = createDefaultLivery(`${name} ${year}`, seed.primary, seed.secondary, seed.accent, shortName);

    return {
      id: seed.id,
      name,
      shortName,
      nationality: seed.nationality,
      headquarters: seed.hq,
      isCustomTeam: false,
      ownerName: seed.owner,
      principalName: seed.principal,
      engineSupplier: engine,
      engineCostPerSeason: 16_000_000,
      budget: seed.budget,
      costCapSpent: Math.round(seed.budget * 0.45),
      annualOperatingCost: Math.round(seed.budget * 0.65),
      debt: 0,
      reputation: seed.rep,
      fanbaseMillions: 12 + (10 - idx) * 6,
      historicalTitles: seed.titles,
      longTermObjectiveTr: seed.objectiveTr,
      longTermObjectiveEn: 'Compete for championship honors and maximize constructor standing.',
      targetPosition: seed.targetPos,
      aiStrategyProfile: seed.strategy,
      carConcept: seed.concept,
      parts: createPartsForRating(seed.rating),
      facilities: createFacilitiesForLevel(seed.facLevel),
      sponsors: [
        SPONSOR_CATALOG[idx % SPONSOR_CATALOG.length],
        SPONSOR_CATALOG[(idx + 2) % SPONSOR_CATALOG.length],
      ],
      boardMembers: [
        { id: `bm_${seed.id}_1`, name: `${seed.owner.split('/')[0].trim()} Temsilcisi`, roleTr: 'Yönetim Kurulu Başkanı', roleEn: 'Board Chairman', priority: 'championship', confidence: 80, stakePercent: 60 },
        { id: `bm_${seed.id}_2`, name: 'Finansal Denetim Üyesi', roleTr: 'Mali Komite Direktörü', roleEn: 'Financial Director', priority: 'profitability', confidence: 78, stakePercent: 40 },
      ],
      boardConfidence: 82,
      logo,
      livery,
      uniform: {
        suitPrimaryColor: seed.primary,
        suitSecondaryColor: seed.secondary,
        suitAccentColor: seed.accent,
        gloveColor: seed.accent,
        shoeColor: '#0f172a',
        capColor: seed.primary,
        pitCrewStyle: 'classic',
      },
      garage: {
        wallColor: seed.secondary,
        floorFinish: 'epoxyGloss',
        lightingColor: seed.accent,
        pitWallTheme: seed.primary,
        trophyCabinetLevel: Math.min(5, Math.max(1, Math.ceil(seed.titles / 3))),
      },
      savedLiveries: [livery],
      savedLogos: [logo],
      seasonPoints: 0,
      seasonWins: 0,
      seasonPodiums: 0,
    };
  });
}

interface RawDriverSeed {
  id: string;
  name: string;
  age: number;
  nat: string;
  flag: string;
  num: number;
  teamId: string | null;
  role: DriverEntity['role'];
  wins: number;
  podiums: number;
  titles: number;
  pace: number;
  racecraft: number;
  quali: number;
  wet: number;
  tire: number;
  consistency: number;
  salary: number;
  traits: DriverEntity['personality'];
  helmetColor: string;
  stripeColor: string;
}

const DRIVERS_2026_SEED: RawDriverSeed[] = [
  { id: 'verstappen', name: 'Max Verstappen', age: 28, nat: 'Hollanda', flag: '🇳🇱', num: 1, teamId: 'red_bull', role: 'lead', wins: 64, podiums: 113, titles: 4, pace: 98, racecraft: 97, quali: 98, wet: 98, tire: 95, consistency: 96, salary: 52_000_000, traits: ['Aggressive', 'Competitive', 'Ambitious'], helmetColor: '#f97316', stripeColor: '#1e3a8a' },
  { id: 'lawson', name: 'Liam Lawson', age: 24, nat: 'Yeni Zelanda', flag: '🇳🇿', num: 30, teamId: 'red_bull', role: 'second', wins: 0, podiums: 2, titles: 0, pace: 85, racecraft: 86, quali: 84, wet: 83, tire: 82, consistency: 83, salary: 6_500_000, traits: ['Aggressive', 'Ambitious'], helmetColor: '#f8fafc', stripeColor: '#ef4444' },
  { id: 'norris', name: 'Lando Norris', age: 26, nat: 'Birleşik Krallık', flag: '🇬🇧', num: 4, teamId: 'mclaren', role: 'equal', wins: 8, podiums: 32, titles: 0, pace: 95, racecraft: 92, quali: 96, wet: 94, tire: 93, consistency: 93, salary: 28_000_000, traits: ['Competitive', 'Loyal', 'Media-conscious'], helmetColor: '#a3e635', stripeColor: '#0f172a' },
  { id: 'piastri', name: 'Oscar Piastri', age: 25, nat: 'Avustralya', flag: '🇦🇺', num: 81, teamId: 'mclaren', role: 'equal', wins: 5, podiums: 18, titles: 0, pace: 94, racecraft: 94, quali: 93, wet: 91, tire: 92, consistency: 95, salary: 22_000_000, traits: ['Calm', 'Competitive', 'Team-oriented'], helmetColor: '#38bdf8', stripeColor: '#f97316' },
  { id: 'leclerc', name: 'Charles Leclerc', age: 28, nat: 'Monako', flag: '🇲🇨', num: 16, teamId: 'ferrari', role: 'equal', wins: 10, podiums: 45, titles: 0, pace: 96, racecraft: 94, quali: 99, wet: 92, tire: 91, consistency: 92, salary: 34_000_000, traits: ['Ambitious', 'Loyal', 'Competitive'], helmetColor: '#dc2626', stripeColor: '#ffffff' },
  { id: 'hamilton', name: 'Lewis Hamilton', age: 41, nat: 'Birleşik Krallık', flag: '🇬🇧', num: 44, teamId: 'ferrari', role: 'equal', wins: 105, podiums: 202, titles: 7, pace: 94, racecraft: 97, quali: 92, wet: 98, tire: 98, consistency: 96, salary: 45_000_000, traits: ['Ambitious', 'Media-conscious', 'Diplomatic'], helmetColor: '#facc15', stripeColor: '#7e22ce' },
  { id: 'russell', name: 'George Russell', age: 28, nat: 'Birleşik Krallık', flag: '🇬🇧', num: 63, teamId: 'mercedes', role: 'lead', wins: 4, podiums: 19, titles: 0, pace: 93, racecraft: 92, quali: 95, wet: 91, tire: 90, consistency: 92, salary: 24_000_000, traits: ['Ambitious', 'Diplomatic', 'Competitive'], helmetColor: '#06b6d4', stripeColor: '#0f172a' },
  { id: 'antonelli', name: 'Kimi Antonelli', age: 19, nat: 'İtalya', flag: '🇮🇹', num: 12, teamId: 'mercedes', role: 'second', wins: 0, podiums: 3, titles: 0, pace: 89, racecraft: 87, quali: 90, wet: 88, tire: 84, consistency: 84, salary: 5_500_000, traits: ['Ambitious', 'Aggressive'], helmetColor: '#10b981', stripeColor: '#ffffff' },
  { id: 'alonso', name: 'Fernando Alonso', age: 44, nat: 'İspanya', flag: '🇪🇸', num: 14, teamId: 'aston_martin', role: 'lead', wins: 32, podiums: 106, titles: 2, pace: 92, racecraft: 98, quali: 91, wet: 96, tire: 96, consistency: 95, salary: 22_000_000, traits: ['Competitive', 'Aggressive', 'Impatient'], helmetColor: '#38bdf8', stripeColor: '#facc15' },
  { id: 'stroll', name: 'Lance Stroll', age: 27, nat: 'Kanada', flag: '🇨🇦', num: 18, teamId: 'aston_martin', role: 'second', wins: 0, podiums: 3, titles: 0, pace: 80, racecraft: 81, quali: 79, wet: 86, tire: 81, consistency: 78, salary: 8_000_000, traits: ['Calm', 'Loyal'], helmetColor: '#047857', stripeColor: '#a3e635' },
  { id: 'sainz', name: 'Carlos Sainz', age: 31, nat: 'İspanya', flag: '🇪🇸', num: 55, teamId: 'williams', role: 'equal', wins: 4, podiums: 27, titles: 0, pace: 92, racecraft: 93, quali: 92, wet: 91, tire: 93, consistency: 94, salary: 16_000_000, traits: ['Team-oriented', 'Calm', 'Diplomatic'], helmetColor: '#ef4444', stripeColor: '#facc15' },
  { id: 'albon', name: 'Alexander Albon', age: 30, nat: 'Tayland', flag: '🇹🇭', num: 23, teamId: 'williams', role: 'equal', wins: 0, podiums: 2, titles: 0, pace: 88, racecraft: 89, quali: 89, wet: 87, tire: 89, consistency: 88, salary: 11_000_000, traits: ['Team-oriented', 'Calm', 'Loyal'], helmetColor: '#2563eb', stripeColor: '#f43f5e' },
  { id: 'gasly', name: 'Pierre Gasly', age: 30, nat: 'Fransa', flag: '🇫🇷', num: 10, teamId: 'alpine', role: 'lead', wins: 1, podiums: 5, titles: 0, pace: 88, racecraft: 88, quali: 89, wet: 88, tire: 87, consistency: 88, salary: 12_500_000, traits: ['Competitive', 'Ambitious'], helmetColor: '#0284c7', stripeColor: '#ef4444' },
  { id: 'colapinto', name: 'Franco Colapinto', age: 23, nat: 'Arjantin', flag: '🇦🇷', num: 43, teamId: 'alpine', role: 'second', wins: 0, podiums: 0, titles: 0, pace: 84, racecraft: 85, quali: 84, wet: 83, tire: 82, consistency: 82, salary: 3_500_000, traits: ['Aggressive', 'Media-conscious'], helmetColor: '#38bdf8', stripeColor: '#ffffff' },
  { id: 'hulkenberg', name: 'Nico Hülkenberg', age: 38, nat: 'Almanya', flag: '🇩🇪', num: 27, teamId: 'audi', role: 'lead', wins: 0, podiums: 0, titles: 0, pace: 87, racecraft: 88, quali: 90, wet: 89, tire: 86, consistency: 90, salary: 9_500_000, traits: ['Calm', 'Diplomatic', 'Team-oriented'], helmetColor: '#ef4444', stripeColor: '#18181b' },
  { id: 'bortoleto', name: 'Gabriel Bortoleto', age: 21, nat: 'Brezilya', flag: '🇧🇷', num: 5, teamId: 'audi', role: 'second', wins: 0, podiums: 0, titles: 0, pace: 84, racecraft: 85, quali: 85, wet: 83, tire: 83, consistency: 84, salary: 3_200_000, traits: ['Ambitious', 'Competitive'], helmetColor: '#22c55e', stripeColor: '#facc15' },
  { id: 'tsunoda', name: 'Yuki Tsunoda', age: 26, nat: 'Japonya', flag: '🇯🇵', num: 22, teamId: 'racing_bulls', role: 'lead', wins: 0, podiums: 0, titles: 0, pace: 86, racecraft: 85, quali: 87, wet: 84, tire: 84, consistency: 83, salary: 6_000_000, traits: ['Aggressive', 'Impatient'], helmetColor: '#f97316', stripeColor: '#ffffff' },
  { id: 'hadjar', name: 'Isack Hadjar', age: 21, nat: 'Fransa', flag: '🇫🇷', num: 6, teamId: 'racing_bulls', role: 'second', wins: 0, podiums: 0, titles: 0, pace: 83, racecraft: 83, quali: 84, wet: 81, tire: 81, consistency: 80, salary: 2_400_000, traits: ['Aggressive', 'Competitive'], helmetColor: '#3b82f6', stripeColor: '#ef4444' },
  { id: 'ocon', name: 'Esteban Ocon', age: 29, nat: 'Fransa', flag: '🇫🇷', num: 31, teamId: 'haas', role: 'equal', wins: 1, podiums: 4, titles: 0, pace: 86, racecraft: 88, quali: 86, wet: 89, tire: 86, consistency: 87, salary: 8_500_000, traits: ['Competitive', 'Aggressive'], helmetColor: '#e11d48', stripeColor: '#0f172a' },
  { id: 'bearman', name: 'Oliver Bearman', age: 21, nat: 'Birleşik Krallık', flag: '🇬🇧', num: 87, teamId: 'haas', role: 'equal', wins: 0, podiums: 0, titles: 0, pace: 84, racecraft: 85, quali: 85, wet: 82, tire: 82, consistency: 83, salary: 3_000_000, traits: ['Ambitious', 'Team-oriented'], helmetColor: '#dc2626', stripeColor: '#38bdf8' },
  // Reserves, Turkish Talents & Free Agents
  { id: 'bolukbasi', name: 'Cem Bölükbaşı', age: 28, nat: 'Türkiye', flag: '🇹🇷', num: 53, teamId: null, role: 'reserve', wins: 0, podiums: 0, titles: 0, pace: 83, racecraft: 84, quali: 83, wet: 82, tire: 83, consistency: 84, salary: 2_800_000, traits: ['Ambitious', 'Loyal', 'Media-conscious'], helmetColor: '#e11d48', stripeColor: '#ffffff' },
  { id: 'guven', name: 'Ayhancan Güven', age: 28, nat: 'Türkiye', flag: '🇹🇷', num: 90, teamId: null, role: 'reserve', wins: 0, podiums: 0, titles: 0, pace: 85, racecraft: 87, quali: 85, wet: 86, tire: 86, consistency: 87, salary: 3_400_000, traits: ['Calm', 'Competitive', 'Team-oriented'], helmetColor: '#ef4444', stripeColor: '#f8fafc' },
  { id: 'bottas', name: 'Valtteri Bottas', age: 36, nat: 'Finlandiya', flag: '🇫🇮', num: 77, teamId: null, role: 'reserve', wins: 10, podiums: 67, titles: 0, pace: 86, racecraft: 86, quali: 89, wet: 85, tire: 88, consistency: 91, salary: 6_500_000, traits: ['Calm', 'Loyal', 'Team-oriented'], helmetColor: '#38bdf8', stripeColor: '#ffffff' },
  { id: 'perez', name: 'Sergio Pérez', age: 36, nat: 'Meksika', flag: '🇲🇽', num: 11, teamId: null, role: 'reserve', wins: 6, podiums: 39, titles: 0, pace: 85, racecraft: 89, quali: 82, wet: 84, tire: 93, consistency: 84, salary: 9_000_000, traits: ['Team-oriented', 'Financially motivated'], helmetColor: '#22c55e', stripeColor: '#ef4444' },
  { id: 'pourchaire', name: 'Théo Pourchaire', age: 22, nat: 'Fransa', flag: '🇫🇷', num: 98, teamId: null, role: 'academy', wins: 0, podiums: 0, titles: 0, pace: 82, racecraft: 82, quali: 83, wet: 80, tire: 81, consistency: 81, salary: 1_500_000, traits: ['Ambitious', 'Competitive'], helmetColor: '#eab308', stripeColor: '#1e3a8a' },
  { id: 'drugovich', name: 'Felipe Drugovich', age: 25, nat: 'Brezilya', flag: '🇧🇷', num: 34, teamId: null, role: 'reserve', wins: 0, podiums: 0, titles: 0, pace: 83, racecraft: 83, quali: 84, wet: 82, tire: 84, consistency: 85, salary: 1_800_000, traits: ['Calm', 'Loyal'], helmetColor: '#10b981', stripeColor: '#facc15' },
];

export function buildDriversForSeason(year: number): DriverEntity[] {
  return DRIVERS_2026_SEED.map((d, index) => {
    let name = d.name;
    let nat = d.nat;
    let flag = d.flag;
    let wins = d.wins;
    let titles = d.titles;

    // Historical legend substitutions for classic seasons
    if (year <= 2005) {
      const legends2004: Record<string, { n: string; nat: string; f: string; w: number; t: number }> = {
        leclerc: { n: 'Michael Schumacher', nat: 'Almanya', f: '🇩🇪', w: 72, t: 6 },
        hamilton: { n: 'Rubens Barrichello', nat: 'Brezilya', f: '🇧🇷', w: 7, t: 0 },
        norris: { n: 'Kimi Räikkönen', nat: 'Finlandiya', f: '🇫🇮', w: 2, t: 0 },
        piastri: { n: 'David Coulthard', nat: 'Birleşik Krallık', f: '🇬🇧', w: 13, t: 0 },
        sainz: { n: 'Juan Pablo Montoya', nat: 'Kolombiya', f: '🇨🇴', w: 4, t: 0 },
        albon: { n: 'Ralf Schumacher', nat: 'Almanya', f: '🇩🇪', w: 6, t: 0 },
        russell: { n: 'Jenson Button', nat: 'Birleşik Krallık', f: '🇬🇧', w: 0, t: 0 },
        antonelli: { n: 'Takuma Sato', nat: 'Japonya', f: '🇯🇵', w: 0, t: 0 },
        gasly: { n: 'Fernando Alonso (Genç)', nat: 'İspanya', f: '🇪🇸', w: 1, t: 0 },
        colapinto: { n: 'Jarno Trulli', nat: 'İtalya', f: '🇮🇹', w: 1, t: 0 },
        verstappen: { n: 'Mark Webber', nat: 'Avustralya', f: '🇦🇺', w: 0, t: 0 },
      };
      if (legends2004[d.id]) {
        name = legends2004[d.id].n;
        nat = legends2004[d.id].nat;
        flag = legends2004[d.id].f;
        wins = legends2004[d.id].w;
        titles = legends2004[d.id].t;
      }
    } else if (year === 2009) {
      const legends2009: Record<string, { n: string; nat: string; f: string; w: number; t: number }> = {
        russell: { n: 'Jenson Button', nat: 'Birleşik Krallık', f: '🇬🇧', w: 7, t: 0 },
        antonelli: { n: 'Rubens Barrichello', nat: 'Brezilya', f: '🇧🇷', w: 11, t: 0 },
        verstappen: { n: 'Sebastian Vettel', nat: 'Almanya', f: '🇩🇪', w: 4, t: 0 },
        lawson: { n: 'Mark Webber', nat: 'Avustralya', f: '🇦🇺', w: 2, t: 0 },
        leclerc: { n: 'Kimi Räikkönen', nat: 'Finlandiya', f: '🇫🇮', w: 18, t: 1 },
        hamilton: { n: 'Felipe Massa', nat: 'Brezilya', f: '🇧🇷', w: 11, t: 0 },
        norris: { n: 'Lewis Hamilton (McLaren)', nat: 'Birleşik Krallık', f: '🇬🇧', w: 11, t: 1 },
      };
      if (legends2009[d.id]) {
        name = legends2009[d.id].n;
        nat = legends2009[d.id].nat;
        flag = legends2009[d.id].f;
        wins = legends2009[d.id].w;
        titles = legends2009[d.id].t;
      }
    }

    return {
      id: d.id,
      name,
      age: d.age,
      nationality: nat,
      flag,
      number: d.num,
      teamId: d.teamId,
      role: d.role,
      careerWins: wins,
      careerPodiums: d.podiums,
      careerChampionships: titles,
      experience: Math.min(99, 60 + d.age),
      pace: d.pace,
      racecraft: d.racecraft,
      qualifying: d.quali,
      wetWeather: d.wet,
      tireManagement: d.tire,
      consistency: d.consistency,
      adaptability: Math.round((d.pace + d.wet) / 2),
      feedback: Math.min(98, 72 + (d.age - 18) * 1.1),
      fitness: 94,
      morale: 86,
      confidence: 88,
      reputation: Math.round((d.pace + d.quali) / 2),
      marketValue: d.salary * 1.25,
      healthStatus: 'healthy',
      recoveryWeeksLeft: 0,
      healthNoteTr: 'Tam fiziksel kondisyonda, yarışa hazır.',
      healthNoteEn: 'Peak physical condition, cleared to race.',
      personality: d.traits,
      teammateRelationship: 78,
      managementRelationship: 82,
      prefersPersonalHelmet: index < 8,
      helmetDesign: {
        baseColor: d.helmetColor,
        stripeColor: d.stripeColor,
        visorTint: '#0ea5e9',
        pattern: index % 2 === 0 ? 'rays' : 'chevron',
        numberVisible: true,
        flagBadge: flag,
      },
      contract: {
        annualSalary: d.salary,
        durationYears: 2 + (index % 2),
        expirationSeason: year + 1 + (index % 2),
        signingBonus: Math.round(d.salary * 0.15),
        winBonus: 250_000,
        championshipBonus: 2_500_000,
        terminationClause: Math.round(d.salary * 0.6),
        extensionOption: true,
        annualRaisePercent: 5,
        confidentialityClause: true,
        gardeningLeaveMonths: 0,
        guaranteedRole: d.role,
        teamOrdersClause: d.role === 'lead' ? 'priority' : d.role === 'second' ? 'obey' : 'equal',
        mediaObligations: 'standard',
      },
      seasonPoints: 0,
      seasonWins: 0,
      seasonPodiums: 0,
      seasonDnfs: 0,
    };
  });
}

export function buildInitialStaff(teams: TeamEntity[], year: number): StaffEntity[] {
  const rolesConfig: Array<{
    role: StaffEntity['role'];
    dept: StaffEntity['department'];
    baseSal: number;
    gardening: number;
  }> = [
    { role: 'Sporting Director', dept: 'executive', baseSal: 2_400_000, gardening: 6 },
    { role: 'Technical Director', dept: 'technical', baseSal: 4_200_000, gardening: 12 },
    { role: 'Chief Aerodynamicist', dept: 'aerodynamics', baseSal: 3_100_000, gardening: 6 },
    { role: 'Head of Vehicle Performance', dept: 'engineering', baseSal: 2_500_000, gardening: 6 },
    { role: 'Race Engineer', dept: 'engineering', baseSal: 1_400_000, gardening: 3 },
    { role: 'Strategy Engineer', dept: 'engineering', baseSal: 1_200_000, gardening: 3 },
    { role: 'Chief Mechanic', dept: 'pitcrew', baseSal: 950_000, gardening: 0 },
    { role: 'Pit Crew Specialist', dept: 'pitcrew', baseSal: 650_000, gardening: 0 },
    { role: 'Commercial Director', dept: 'commercial', baseSal: 1_600_000, gardening: 3 },
    { role: 'Academy Director', dept: 'academy', baseSal: 1_100_000, gardening: 0 },
    { role: 'Chief Medical & Fitness Officer', dept: 'medical', baseSal: 980_000, gardening: 0 },
  ];

  const firstNames = ['Kerem', 'Hakan', 'Emre', 'James', 'Enrico', 'Pierre', 'Hannah', 'Rob', 'Simone', 'Loïc', 'Pete', 'Gianpiero', 'matteo', 'Selin', 'Burak', 'Defne'];
  const lastNames = ['Yılmaz', 'Demir', 'Kaya', 'Allison', 'Cardile', 'Waché', 'Schmitz', 'Marshall', 'Resta', 'Serra', 'Bonnington', 'Lambiase', 'Ersoy', 'Aydın', 'Vural', 'anc'];
  const nats = ['Türkiye', 'Birleşik Krallık', 'İtalya', 'Fransa', 'Almanya', 'Avustralya'];
  const traits: StaffEntity['personality'][] = ['Ambitious', 'Calm', 'Loyal', 'Competitive', 'Team-oriented', 'Financially motivated'];

  const staffList: StaffEntity[] = [];

  teams.forEach((team, tIdx) => {
    rolesConfig.forEach((rc, rIdx) => {
      const idx = tIdx * rolesConfig.length + rIdx;
      const skillBase = Math.min(96, Math.max(68, team.reputation + ((rIdx % 3) - 1) * 3));
      const salary = Math.round(rc.baseSal * (skillBase / 82));
      staffList.push({
        id: `staff_${team.id}_${rIdx}`,
        name: `${firstNames[idx % firstNames.length]} ${lastNames[(idx * 3 + rIdx) % lastNames.length]}`,
        age: 32 + ((idx * 5) % 24),
        nationality: team.isCustomTeam && rIdx % 2 === 0 ? 'Türkiye' : nats[idx % nats.length],
        department: rc.dept,
        role: rc.role,
        teamId: team.id,
        experience: skillBase - 2,
        technicalSkill: skillBase,
        leadership: Math.min(97, skillBase - 1),
        efficiency: Math.min(98, skillBase + 1),
        potential: Math.min(99, skillBase + 5),
        reputation: skillBase,
        morale: 85,
        loyalty: 78,
        ambition: 82,
        managementRelationship: 84,
        personality: traits[idx % traits.length],
        onGardeningLeaveUntilWeek: 0,
        contract: {
          annualSalary: salary,
          durationYears: 3,
          expirationSeason: year + 2,
          signingBonus: Math.round(salary * 0.15),
          winBonus: 50_000,
          championshipBonus: 450_000,
          terminationClause: Math.round(salary * 0.5),
          extensionOption: true,
          annualRaisePercent: 4,
          confidentialityClause: true,
          gardeningLeaveMonths: rc.gardening,
        },
      });
    });
  });

  // Add Free Agent Elite Staff available for recruitment
  const freeAgentSeeds: Array<{ name: string; role: StaffEntity['role']; dept: StaffEntity['department']; skill: number; nat: string; sal: number }> = [
    { name: 'Prof. Dr. Tarık Özkan', role: 'Technical Director', dept: 'technical', skill: 93, nat: 'Türkiye', sal: 4_800_000 },
    { name: 'Elena Rostova', role: 'Chief Aerodynamicist', dept: 'aerodynamics', skill: 92, nat: 'İtalya', sal: 3_600_000 },
    { name: 'Marcus Vance', role: 'Strategy Engineer', dept: 'engineering', skill: 91, nat: 'Birleşik Krallık', sal: 1_550_000 },
    { name: 'Sinan Aksoy', role: 'Sporting Director', dept: 'executive', skill: 89, nat: 'Türkiye', sal: 2_600_000 },
    { name: 'Dr. Leyla Çetin', role: 'Chief Medical & Fitness Officer', dept: 'medical', skill: 92, nat: 'Türkiye', sal: 1_150_000 },
    { name: 'Lucas Weber', role: 'Head of Vehicle Performance', dept: 'engineering', skill: 90, nat: 'Almanya', sal: 2_750_000 },
  ];

  freeAgentSeeds.forEach((fa, i) => {
    staffList.push({
      id: `staff_free_${i}`,
      name: fa.name,
      age: 39 + i * 2,
      nationality: fa.nat,
      department: fa.dept,
      role: fa.role,
      teamId: null,
      experience: fa.skill,
      technicalSkill: fa.skill,
      leadership: fa.skill - 2,
      efficiency: fa.skill + 1,
      potential: Math.min(99, fa.skill + 4),
      reputation: fa.skill,
      morale: 88,
      loyalty: 80,
      ambition: 90,
      managementRelationship: 85,
      personality: 'Ambitious',
      onGardeningLeaveUntilWeek: 0,
      contract: {
        annualSalary: fa.sal,
        durationYears: 3,
        expirationSeason: year + 3,
        signingBonus: Math.round(fa.sal * 0.2),
        winBonus: 65_000,
        championshipBonus: 600_000,
        terminationClause: Math.round(fa.sal * 0.5),
        extensionOption: true,
        annualRaisePercent: 5,
        confidentialityClause: true,
        gardeningLeaveMonths: 6,
      },
    });
  });

  return staffList;
}

export function createInitialCareerState(params: {
  gameMode: GameMode;
  seasonYear: number;
  playerTeamId: string;
  playerName: string;
  customTeamConfig?: {
    name: string;
    nationality: string;
    headquarters: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    engineSupplier: string;
    initialBudget: number;
    facilityLevel: number;
    leadDriverId: string;
    secondDriverId: string;
  };
  scenarioId?: string;
}): CareerState {
  const { gameMode, seasonYear, playerName, scenarioId } = params;
  const regulations = getRegulationsForYear(seasonYear);
  const teams = buildTeamsForSeason(seasonYear);
  const drivers = buildDriversForSeason(seasonYear);

  let selectedTeamId = params.playerTeamId;

  if (params.customTeamConfig) {
    const cfg = params.customTeamConfig;
    const customTeam = createDefaultCustomTeam(
      cfg.name || 'Senin Takımın',
      cfg.primaryColor,
      cfg.secondaryColor,
      cfg.accentColor,
      cfg.engineSupplier,
      cfg.initialBudget,
      cfg.facilityLevel
    );
    customTeam.nationality = cfg.nationality || 'Türkiye';
    customTeam.headquarters = cfg.headquarters || 'İstanbul, Türkiye';
    customTeam.principalName = playerName;
    if (gameMode === 'owner') {
      customTeam.ownerName = playerName;
    }
    teams.unshift(customTeam);
    selectedTeamId = customTeam.id;

    // Assign chosen drivers to custom team
    drivers.forEach((d) => {
      if (d.id === cfg.leadDriverId) {
        d.teamId = customTeam.id;
        d.role = 'lead';
      } else if (d.id === cfg.secondDriverId) {
        d.teamId = customTeam.id;
        d.role = 'second';
      }
    });
  } else {
    const targetTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
    selectedTeamId = targetTeam.id;
    targetTeam.principalName = playerName;
    if (gameMode === 'owner') {
      targetTeam.ownerName = playerName;
    }
  }

  // Apply Scenario overrides if any
  if (scenarioId) {
    const scen = SCENARIOS.find((s) => s.id === scenarioId);
    const pTeam = teams.find((t) => t.id === selectedTeamId);
    if (scen && pTeam) {
      if (scen.budgetOverride !== undefined) pTeam.budget = scen.budgetOverride;
      if (scen.debtOverride !== undefined) pTeam.debt = scen.debtOverride;
      if (scen.leadDriverDeparted) {
        const teamDrivers = drivers.filter((d) => d.teamId === pTeam.id);
        if (teamDrivers[0]) {
          teamDrivers[0].teamId = null;
          // Promote reserve or free agent
          const reserve = drivers.find((d) => d.id === 'guven' || d.teamId === null);
          if (reserve) {
            reserve.teamId = pTeam.id;
            reserve.role = 'second';
          }
        }
      }
    }
  }

  // Ensure every team has at least 2 drivers and 1 reserve
  teams.forEach((team) => {
    const current = drivers.filter((d) => d.teamId === team.id);
    while (current.length < 2) {
      const free = drivers.find((d) => d.teamId === null);
      if (!free) break;
      free.teamId = team.id;
      free.role = current.length === 0 ? 'lead' : 'second';
      current.push(free);
    }
  });

  const staff = buildInitialStaff(teams, seasonYear);
  const playerTeam = teams.find((t) => t.id === selectedTeamId)!;

  const carSetups: Record<string, CareerState['carSetups'][string]> = {};
  drivers.forEach((d) => {
    carSetups[d.id] = {
      frontWingAngle: 54,
      rearWingAngle: 52,
      antiRollBar: 50,
      tirePressurePsi: 22.5,
      brakeBiasRear: 56,
      setupConfidence: 76,
    };
  });

  return {
    saveId: `career_${Date.now()}`,
    saveName: `${playerTeam.name} (${seasonYear})`,
    lastSavedIso: new Date().toISOString(),
    gameMode,
    scenarioId,
    seasonYear,
    currentWeek: 1,
    currentRoundIndex: 0,
    playerTeamId: selectedTeamId,
    playerName,
    regulations,
    teams,
    drivers,
    staff,
    calendar: CIRCUITS_DATA,
    inbox: [
      {
        id: 'welcome_board',
        week: 1,
        dateStr: `Hafta 1 · ${seasonYear}`,
        category: 'BOARD',
        titleTr: `${playerTeam.name} Yönetim Kurulu Hoş Geldiniz Mesajı`,
        titleEn: `Welcome to ${playerTeam.name} Board of Directors`,
        bodyTr: `Sayın ${playerName}, ${seasonYear} Formula 1 sezonunda ${
          gameMode === 'owner' ? 'Takım Sahibi ve Patronu' : 'Takım Patronu'
        } olarak görevinize başladınız. Yönetim kurulumuzun bu sezonki öncelikli hedefi Takımlar Şampiyonasında İlk ${playerTeam.targetPosition} içerisinde yer almak ve FIA ${
          regulations.costCapUsd ? `$${(regulations.costCapUsd / 1_000_000).toFixed(0)}M Cost Cap` : 'mali'
        } kurallarına tam uyum sağlamaktır.`,
        bodyEn: `Welcome ${playerName}. Your target for the ${seasonYear} season is P${playerTeam.targetPosition} in the Constructors' Championship while maintaining strict financial discipline.`,
        read: false,
        actionRequired: true,
        choices: [
          {
            id: 'promise_podiums',
            labelTr: 'Agresif Hedef: "Podyumlar ve ilk sıra için savaşacağız"',
            labelEn: 'Aggressive Target: "We will fight for podiums"',
            effectSummaryTr: 'Pilot morali +5, Yönetim Beklentisi yükselir, Medya İtibarı +3',
            effectSummaryEn: 'Driver Morale +5, Board Confidence +4, Reputation +3',
            moraleDelta: 5,
            boardConfidenceDelta: 4,
            reputationDelta: 3,
          },
          {
            id: 'promise_realistic',
            labelTr: 'Dengeli Strateji: "Sürdürülebilir Ar-Ge ve bütçe disiplini önceliğimiz"',
            labelEn: 'Balanced Strategy: "Sustainable R&D and Cost Cap discipline"',
            effectSummaryTr: 'Yönetim Kurulu Güveni +6, Nakit Rezerv Desteği +$1.5M',
            effectSummaryEn: 'Board Confidence +6, Investor Bonus +$1.5M',
            budgetDelta: 1_500_000,
            boardConfidenceDelta: 6,
          },
        ],
      },
      {
        id: 'fia_reg_brief',
        week: 1,
        dateStr: `Hafta 1 · ${seasonYear}`,
        category: 'FIA',
        titleTr: `FIA ${seasonYear} Sportif ve Teknik Regülasyon Bildirgesi`,
        titleEn: `FIA ${seasonYear} Sporting & Technical Regulations Bulletin`,
        bodyTr: `${regulations.eraNameTr}. Motor Spesifikasyonu: ${regulations.engineSpecTr}. Lastik Kuralı: ${regulations.tireRuleTr}. ${
          regulations.isHistoricalApproximation
            ? 'Not: Bu tarihsel sezon için doğrulanmış dönem kuralları ve yapılandırılabilir tarihsel yaklaşım veritabanı aktif edilmiştir.'
            : 'Tüm telemetri ve FIA hakem denetimleri aktif durumdadır.'
        }`,
        bodyEn: `${regulations.eraNameEn}. Engine: ${regulations.engineSpecEn}. Tires: ${regulations.tireRuleEn}.`,
        read: false,
      },
    ],
    ledger: [
      {
        id: 'led_init_1',
        week: 1,
        category: 'SPONSOR',
        descriptionTr: 'Sezon Başlangıç Ana Sponsor Ön Ödemesi',
        descriptionEn: 'Season Opening Title Sponsor Advance',
        amount: 14_500_000,
        countsTowardCostCap: false,
      },
      {
        id: 'led_init_2',
        week: 1,
        category: 'ENGINE',
        descriptionTr: `${playerTeam.engineSupplier} Güç Ünitesi İlk Taksit Ödemesi`,
        descriptionEn: `${playerTeam.engineSupplier} Power Unit Initial Installment`,
        amount: -4_500_000,
        countsTowardCostCap: true,
      },
    ],
    carSetups,
    transferRumors: [
      {
        id: 'rum_1',
        week: 1,
        textTr: 'Padok Kulisleri: Red Bull ve Mercedes, 2026 aerodinamik güncellemeleri için rakip takımların baş aerodinamistleriyle gizli görüşmeler yürütüyor.',
        textEn: 'Paddock Rumor: Rival top teams are quietly approaching senior aerodynamicists ahead of mid-season upgrades.',
      },
      {
        id: 'rum_2',
        week: 1,
        textTr: 'Pilot Pazarı: Ayhancan Güven ve Cem Bölükbaşı simülatör testlerindeki yüksek tempolarıyla takım patronlarının dikkatini çekti.',
        textEn: 'Driver Market: Reserve talents are posting impressive simulator telemetry numbers.',
      },
    ],
    seasonHistory: [],
    sandboxSettings: {
      unlimitedBudget: gameMode === 'sandbox',
      disableCostCap: gameMode === 'sandbox',
      noDriverInjuries: false,
      noSacking: gameMode === 'owner' || gameMode === 'sandbox',
      customWearMultiplier: 1.0,
    },
  };
}
