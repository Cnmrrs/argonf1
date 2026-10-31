import {
  CareerState,
  CircuitData,
  DriverEntity,
  LiveRaceCarState,
  RadioMessage,
  StewardIncident,
  TireCompound,
  TrackStatus,
  WeatherCondition,
} from '../core/types';
import { calculateTeamCarPerformance } from '../simulation/simulationEngine';
import { formatLapTime } from '../core/i18n';

export interface RaceSessionBundle {
  circuit: CircuitData;
  totalLaps: number;
  currentLap: number;
  sessionElapsedSec: number;
  trackStatus: TrackStatus;
  statusTimerSec: number;
  weather: WeatherCondition;
  trackWaterLevel: number;       // 0 (bone dry) to 100 (monsoon)
  ambientTempC: number;
  trackTempC: number;
  windSpeedKmh: number;
  forecastTextTr: string;
  forecastTextEn: string;
  overallBestLap: number;
  overallBestS1: number;
  overallBestS2: number;
  overallBestS3: number;
  cars: LiveRaceCarState[];
  radioMessages: RadioMessage[];
  stewardIncidents: StewardIncident[];
  isFinished: boolean;
}

export function runQualifyingOrder(
  state: CareerState,
  circuit: CircuitData
): Array<{ driver: DriverEntity; qualiTime: number }> {
  // Active race drivers (2 per team)
  const raceDrivers: DriverEntity[] = [];
  state.teams.forEach((team) => {
    const tDrivers = state.drivers
      .filter((d) => d.teamId === team.id && d.healthStatus !== 'unavailable')
      .sort((a, b) => (a.role === 'lead' ? -1 : b.role === 'lead' ? 1 : b.pace - a.pace));
    raceDrivers.push(...tDrivers.slice(0, 2));
  });

  const results = raceDrivers.map((drv) => {
    const team = state.teams.find((t) => t.id === drv.teamId)!;
    const perf = calculateTeamCarPerformance(team, state.staff);
    const setupConf = state.carSetups[drv.id]?.setupConfidence || 75;

    const carSuitability =
      perf.aerodynamics * circuit.downforceSensitivity * 0.45 +
      perf.straightLineSpeed * circuit.powerSensitivity * 0.45 +
      perf.corneringGrip * 0.35;

    const driverFactor = drv.qualifying * 0.65 + drv.pace * 0.35;
    const fitnessPenalty = drv.healthStatus === 'illness' ? 0.55 : drv.healthStatus === 'fatigued' ? 0.22 : 0;
    const setupBonus = (setupConf - 75) * 0.008;
    const randomVariance = (Math.random() - 0.5) * 0.38;

    const deltaFromBase =
      ((92 - carSuitability * 0.82) * 0.095) +
      ((94 - driverFactor) * 0.045) +
      fitnessPenalty -
      setupBonus +
      randomVariance;

    return {
      driver: drv,
      qualiTime: Number((circuit.baseLapTimeSec + deltaFromBase).toFixed(3)),
    };
  });

  results.sort((a, b) => a.qualiTime - b.qualiTime);
  return results;
}

export function initializeRaceSession(
  state: CareerState,
  circuit: CircuitData,
  startingWeather?: WeatherCondition
): RaceSessionBundle {
  const qualiOrder = runQualifyingOrder(state, circuit);
  const isWetStart =
    startingWeather === 'LIGHT_RAIN' ||
    startingWeather === 'HEAVY_RAIN' ||
    (!startingWeather && Math.random() * 100 < circuit.weatherRainChance * 0.6);

  const weather: WeatherCondition =
    startingWeather || (isWetStart ? 'LIGHT_RAIN' : Math.random() < 0.3 ? 'CLOUDY' : 'DRY');
  const trackWaterLevel = weather === 'HEAVY_RAIN' ? 75 : weather === 'LIGHT_RAIN' ? 38 : 0;

  const cars: LiveRaceCarState[] = qualiOrder.map((entry, idx) => {
    const drv = entry.driver;
    const team = state.teams.find((t) => t.id === drv.teamId)!;
    const defaultCompound: TireCompound =
      weather === 'HEAVY_RAIN'
        ? 'wet'
        : weather === 'LIGHT_RAIN'
        ? 'intermediate'
        : idx < 10
        ? 'soft'
        : 'medium';

    return {
      driverId: drv.id,
      driverName: drv.name,
      driverShort: drv.name
        .split(' ')
        .pop()!
        .slice(0, 3)
        .toUpperCase(),
      driverNumber: drv.number,
      teamId: team.id,
      teamName: team.name,
      primaryColor: team.livery.mainBodyColor,
      secondaryColor: team.livery.accentColor,
      position: idx + 1,
      gridPosition: idx + 1,
      currentLap: 1,
      trackProgress: Math.max(0, 0.015 - idx * 0.0007),
      totalElapsedTime: idx * 0.25,
      gapToLeader: idx * 0.25,
      gapToAhead: idx === 0 ? 0 : 0.25,
      lastLapTime: entry.qualiTime,
      bestLapTime: 0,
      sector1Time: Number((entry.qualiTime * 0.31).toFixed(3)),
      sector2Time: Number((entry.qualiTime * 0.38).toFixed(3)),
      sector3Time: Number((entry.qualiTime * 0.31).toFixed(3)),
      sector1Color: 'none',
      sector2Color: 'none',
      sector3Color: 'none',
      tireCompound: defaultCompound,
      tireWear: 100,
      tireTempC: 92,
      tireAgeLaps: 0,
      fuelKg: state.regulations.refuelingAllowed ? 48 : 105,
      ersBattery: 100,
      paceMode: 'standard',
      ersMode: 'balanced',
      fuelMode: 'standard',
      inPit: false,
      pitBoxTimer: 0,
      pitStopsCount: 0,
      requestedPitCompound: null,
      pitThisLap: false,
      status: 'RUNNING',
      timePenaltySec: 0,
      warningsTrackLimits: 0,
      speedKmh: 245,
      gear: 6,
      rpm: 11400,
      drsActive: false,
      teamOrder: 'free',
    };
  });

  const playerTeam = state.teams.find((t) => t.id === state.playerTeamId)!;

  return {
    circuit,
    totalLaps: circuit.laps,
    currentLap: 1,
    sessionElapsedSec: 0,
    trackStatus: 'GREEN',
    statusTimerSec: 0,
    weather,
    trackWaterLevel,
    ambientTempC: weather === 'DRY' ? 26 : 19,
    trackTempC: weather === 'DRY' ? 38 : 23,
    windSpeedKmh: 14,
    forecastTextTr:
      circuit.weatherRainChance > 35
        ? `Meteoroloji Radarı: %${circuit.weatherRainChance} yağış ihtimali. Orta turlarda geçiş lastiği (Intermediate) penceresi açılabilir.`
        : `Meteoroloji Radarı: Pist sıcaklığı ${weather === 'DRY' ? 38 : 23}°C, düşük yağış riski (%${circuit.weatherRainChance}).`,
    forecastTextEn: `Weather Radar: ${circuit.weatherRainChance}% rain probability. Track temp ${weather === 'DRY' ? 38 : 23}°C.`,
    overallBestLap: 999,
    overallBestS1: 999,
    overallBestS2: 999,
    overallBestS3: 999,
    cars,
    radioMessages: [
      {
        id: 'radio_start_1',
        lap: 1,
        timestamp: '00:02',
        senderName: 'Yarış Kontrol (FIA)',
        senderRole: 'FIA',
        teamId: 'fia',
        teamColor: '#38bdf8',
        textTr: `${circuit.name} Grand Prix’si başladı! Pist durumu YEŞİL, ilk 2 tur sonunda DRS aktif olacaktır.`,
        textEn: `${circuit.name} Grand Prix is underway! Track is GREEN.`,
        priority: 'normal',
      },
      {
        id: 'radio_start_2',
        lap: 1,
        timestamp: '00:05',
        senderName: `${playerTeam.shortName} Baş Yarış Mühendisi`,
        senderRole: 'ENGINEER',
        teamId: playerTeam.id,
        teamColor: playerTeam.livery.mainBodyColor,
        textTr: 'Telsiz bağlantısı net. İlk virajda temiz kalalım, lastik sıcaklıklarını hedef pencerede tutuyoruz.',
        textEn: 'Radio check loud and clear. Keep it clean into Turn 1 and bring the tires in gently.',
        priority: 'strategy',
      },
    ],
    stewardIncidents: [],
    isFinished: false,
  };
}

function getCompoundSpeedDelta(compound: TireCompound, waterLevel: number): number {
  if (waterLevel > 55) {
    // Heavy wet conditions
    if (compound === 'wet') return 0;
    if (compound === 'intermediate') return 2.1;
    return 8.5; // Slicks on flooded track!
  }
  if (waterLevel > 18) {
    // Damp / intermediate conditions
    if (compound === 'intermediate') return 0;
    if (compound === 'wet') return 1.8;
    return 4.6;
  }
  // Dry track
  if (compound === 'soft') return -0.45;
  if (compound === 'medium') return 0.0;
  if (compound === 'hard') return 0.42;
  if (compound === 'intermediate') return 3.2;
  return 5.8;
}

function getCompoundWearRate(compound: TireCompound, waterLevel: number): number {
  if (compound === 'soft') return 2.35;
  if (compound === 'medium') return 1.55;
  if (compound === 'hard') return 1.05;
  if (compound === 'intermediate') return waterLevel < 12 ? 3.1 : 1.4;
  return waterLevel < 25 ? 3.5 : 1.2;
}

export function stepRaceSimulation(
  bundle: RaceSessionBundle,
  state: CareerState,
  simDeltaSec: number
): RaceSessionBundle {
  if (bundle.isFinished) return bundle;

  const circuit = bundle.circuit;
  const sessionElapsedSec = bundle.sessionElapsedSec + simDeltaSec;
  let trackStatus = bundle.trackStatus;
  let statusTimerSec = Math.max(0, bundle.statusTimerSec - simDeltaSec);
  if (statusTimerSec === 0 && trackStatus !== 'GREEN') {
    trackStatus = 'GREEN';
  }

  // Dynamic weather evolution
  let weather = bundle.weather;
  let trackWaterLevel = bundle.trackWaterLevel;
  if (Math.random() < 0.003 * simDeltaSec) {
    const roll = Math.random() * 100;
    if (roll < circuit.weatherRainChance * 0.4) {
      weather = 'HEAVY_RAIN';
    } else if (roll < circuit.weatherRainChance) {
      weather = 'LIGHT_RAIN';
    } else if (trackWaterLevel > 10) {
      weather = 'DRYING';
    } else {
      weather = 'DRY';
    }
  }
  if (weather === 'HEAVY_RAIN') trackWaterLevel = Math.min(100, trackWaterLevel + simDeltaSec * 0.45);
  else if (weather === 'LIGHT_RAIN') trackWaterLevel = Math.min(60, Math.max(25, trackWaterLevel + simDeltaSec * 0.2));
  else trackWaterLevel = Math.max(0, trackWaterLevel - simDeltaSec * 0.35);

  const radioMessages = [...bundle.radioMessages];
  const stewardIncidents = [...bundle.stewardIncidents];
  let overallBestLap = bundle.overallBestLap;
  let overallBestS1 = bundle.overallBestS1;
  let overallBestS2 = bundle.overallBestS2;
  let overallBestS3 = bundle.overallBestS3;

  const cars = bundle.cars.map((car) => ({ ...car }));

  cars.forEach((car) => {
    if (car.status === 'OUT') {
      car.speedKmh = 0;
      car.rpm = 0;
      return;
    }

    const team = state.teams.find((t) => t.id === car.teamId)!;
    const drv = state.drivers.find((d) => d.id === car.driverId)!;
    const perf = calculateTeamCarPerformance(team, state.staff);

    // Handle active Pit Stop stationary timer
    if (car.inPit) {
      car.speedKmh = 80;
      car.rpm = 6200;
      car.gear = 2;
      car.pitBoxTimer -= simDeltaSec;
      if (car.pitBoxTimer <= 0) {
        car.inPit = false;
        car.status = 'RUNNING';
        const nextComp: TireCompound =
          car.requestedPitCompound ||
          (trackWaterLevel > 55
            ? 'wet'
            : trackWaterLevel > 18
            ? 'intermediate'
            : bundle.totalLaps - car.currentLap <= 16
            ? 'soft'
            : 'hard');
        car.tireCompound = nextComp;
        car.tireWear = 100;
        car.tireTempC = 85;
        car.tireAgeLaps = 0;
        car.requestedPitCompound = null;
        car.pitThisLap = false;
        car.pitStopsCount += 1;
        if (state.regulations.refuelingAllowed) {
          car.fuelKg = Math.min(95, car.fuelKg + 42);
        }
      }
      return;
    }

    // Calculate target lap time in seconds
    const paceDelta =
      car.paceMode === 'attack'
        ? -0.65
        : car.paceMode === 'push'
        ? -0.35
        : car.paceMode === 'conserve'
        ? 0.48
        : 0;
    const ersDelta =
      car.ersMode === 'overtake' && car.ersBattery > 8
        ? -0.42
        : car.ersMode === 'harvest'
        ? 0.32
        : 0;
    const fuelDelta =
      car.fuelMode === 'rich'
        ? -0.25
        : car.fuelMode === 'lean'
        ? 0.28
        : 0;

    const compoundDelta = getCompoundSpeedDelta(car.tireCompound, trackWaterLevel);
    const wearPenalty = car.tireWear < 40 ? (40 - car.tireWear) * 0.085 : (100 - car.tireWear) * 0.014;
    const fuelWeightPenalty = car.fuelKg * 0.026;
    const carPerfDelta = (90 - perf.overall) * 0.095;
    const driverSkill = trackWaterLevel > 20 ? drv.wetWeather : drv.pace;
    const driverDelta = (94 - driverSkill) * 0.042;
    const scMultiplier = trackStatus === 'SC' ? 1.42 : trackStatus === 'VSC' ? 1.25 : 1.0;

    const drsActive =
      state.regulations.drsEnabled &&
      trackStatus === 'GREEN' &&
      trackWaterLevel < 15 &&
      car.currentLap > 2 &&
      car.gapToAhead > 0 &&
      car.gapToAhead < 1.0 &&
      (car.trackProgress < 0.22 || (car.trackProgress > 0.58 && car.trackProgress < 0.76));

    car.drsActive = drsActive;
    const drsBonus = drsActive ? -0.38 : 0;

    // Team order speed adjustment
    const teamOrderDelta = car.teamOrder === 'letTeammatePass' ? 1.2 : 0;

    const effectiveLapSec = Math.max(
      55,
      (circuit.baseLapTimeSec +
        carPerfDelta +
        driverDelta +
        compoundDelta +
        wearPenalty +
        fuelWeightPenalty +
        paceDelta +
        ersDelta +
        fuelDelta +
        drsBonus +
        teamOrderDelta) *
        scMultiplier
    );

    const progressDelta = simDeltaSec / effectiveLapSec;
    const prevProgress = car.trackProgress;
    car.trackProgress += progressDelta;
    car.totalElapsedTime += simDeltaSec;

    // Update live telemetry readouts
    const wpIdx = Math.floor((car.trackProgress % 1) * circuit.waypoints.length);
    const isCorner = wpIdx % 2 === 1;
    const baseSpeed = isCorner ? 165 + perf.corneringGrip * 0.65 : 292 + perf.straightLineSpeed * 0.48 + (drsActive ? 14 : 0);
    car.speedKmh = Math.round(baseSpeed / scMultiplier);
    car.gear = Math.max(2, Math.min(8, Math.floor(car.speedKmh / 41)));
    car.rpm = Math.round(9200 + ((car.speedKmh % 42) / 42) * (state.seasonYear <= 2005 ? 9400 : 3600));

    // Tire wear & temperature + ERS + Fuel consumption
    const wearMult =
      circuit.tireWearMultiplier *
      state.sandboxSettings.customWearMultiplier *
      (car.paceMode === 'attack' ? 1.45 : car.paceMode === 'push' ? 1.22 : car.paceMode === 'conserve' ? 0.74 : 1.0) *
      (1 - (drv.tireManagement - 75) * 0.005);

    car.tireWear = Math.max(
      0,
      car.tireWear - getCompoundWearRate(car.tireCompound, trackWaterLevel) * wearMult * progressDelta
    );
    const targetTireTemp =
      car.paceMode === 'attack' ? 114 : car.paceMode === 'push' ? 105 : car.paceMode === 'conserve' ? 88 : 96;
    car.tireTempC = Math.round(car.tireTempC + (targetTireTemp - car.tireTempC) * 0.15);

    car.fuelKg = Math.max(0.2, car.fuelKg - 1.65 * progressDelta * (car.fuelMode === 'rich' ? 1.15 : car.fuelMode === 'lean' ? 0.86 : 1));
    if (car.ersMode === 'overtake') {
      car.ersBattery = Math.max(0, car.ersBattery - 28 * progressDelta);
    } else if (car.ersMode === 'harvest') {
      car.ersBattery = Math.min(100, car.ersBattery + 32 * progressDelta);
    } else {
      car.ersBattery = Math.max(15, Math.min(100, car.ersBattery - 4 * progressDelta));
    }

    // AI Automatic Pit Strategy Decision
    if (car.teamId !== state.playerTeamId && !car.pitThisLap && car.currentLap < bundle.totalLaps - 1) {
      const wrongWeatherTire =
        (trackWaterLevel > 25 && car.tireCompound !== 'intermediate' && car.tireCompound !== 'wet') ||
        (trackWaterLevel < 10 && (car.tireCompound === 'intermediate' || car.tireCompound === 'wet'));
      if (car.tireWear < 28 || wrongWeatherTire || (state.regulations.refuelingAllowed && car.fuelKg < 6)) {
        car.pitThisLap = true;
        car.requestedPitCompound =
          trackWaterLevel > 55
            ? 'wet'
            : trackWaterLevel > 20
            ? 'intermediate'
            : bundle.totalLaps - car.currentLap < 18
            ? 'soft'
            : 'hard';
      }
    }

    // Lap Completion Check
    if (car.trackProgress >= 1.0) {
      car.trackProgress -= 1.0;
      car.currentLap += 1;
      car.tireAgeLaps += 1;

      const lapVar = (Math.random() - 0.5) * 0.24;
      const recordedLap = Number((effectiveLapSec + lapVar).toFixed(3));
      car.lastLapTime = recordedLap;

      const s1 = Number((recordedLap * 0.31).toFixed(3));
      const s2 = Number((recordedLap * 0.38).toFixed(3));
      const s3 = Number((recordedLap - s1 - s2).toFixed(3));
      car.sector1Time = s1;
      car.sector2Time = s2;
      car.sector3Time = s3;

      car.sector1Color = s1 < overallBestS1 ? 'purple' : s1 <= car.sector1Time ? 'green' : 'yellow';
      car.sector2Color = s2 < overallBestS2 ? 'purple' : s2 <= car.sector2Time ? 'green' : 'yellow';
      car.sector3Color = s3 < overallBestS3 ? 'purple' : s3 <= car.sector3Time ? 'green' : 'yellow';

      if (s1 < overallBestS1) overallBestS1 = s1;
      if (s2 < overallBestS2) overallBestS2 = s2;
      if (s3 < overallBestS3) overallBestS3 = s3;
      if (car.bestLapTime === 0 || recordedLap < car.bestLapTime) {
        car.bestLapTime = recordedLap;
      }
      if (recordedLap < overallBestLap) {
        overallBestLap = recordedLap;
      }

      // Enter pit box if scheduled
      if (car.pitThisLap && car.currentLap <= bundle.totalLaps) {
        car.inPit = true;
        car.status = 'PIT';
        const pitFacilityLvl = team.facilities.pitTraining?.level || 3;
        const pitStopStationary = Math.max(1.9, 2.8 - pitFacilityLvl * 0.16 + Math.random() * 0.4);
        car.pitBoxTimer = circuit.pitLossSec * 0.45 + pitStopStationary;

        if (car.teamId === state.playerTeamId) {
          radioMessages.unshift({
            id: `pit_in_${car.driverId}_${car.currentLap}`,
            lap: car.currentLap,
            timestamp: `T${car.currentLap}`,
            senderName: `${car.driverName} Pit Ekibi`,
            senderRole: 'ENGINEER',
            teamId: car.teamId,
            teamColor: car.primaryColor,
            textTr: `${car.driverName} pite girdi! Hedef pit stop süresi: ${pitStopStationary.toFixed(2)} sn.`,
            textEn: `${car.driverName} is in the pit box! Stationary target: ${pitStopStationary.toFixed(2)}s.`,
            priority: 'strategy',
          });
        }
      }

      // Low Tire / Weather Radio Warnings for Player Drivers
      if (car.teamId === state.playerTeamId && car.tireWear < 32 && !car.pitThisLap) {
        radioMessages.unshift({
          id: `tire_warn_${car.driverId}_${car.currentLap}`,
          lap: car.currentLap,
          timestamp: `T${car.currentLap}`,
          senderName: car.driverName,
          senderRole: 'DRIVER',
          teamId: car.teamId,
          teamColor: car.primaryColor,
          textTr: `Telsiz: "Arka lastikler tamamen bitti (%${Math.round(car.tireWear)}), viraj çıkışlarında tutunma kaybediyorum! Pite girmemiz lazım."`,
          textEn: `Radio: "Rear tires are gone (${Math.round(car.tireWear)}%), losing traction on exit! Box me soon."`,
          priority: 'urgent',
        });
      }

      // Simulated Rival Team Radio interception
      if (car.teamId !== state.playerTeamId && car.position <= 5 && Math.random() < 0.08) {
        radioMessages.unshift({
          id: `rival_rad_${car.driverId}_${car.currentLap}_${Math.random()}`,
          lap: car.currentLap,
          timestamp: `T${car.currentLap}`,
          senderName: `[Rakip Telsiz] ${car.driverName} (${team.shortName})`,
          senderRole: 'RIVAL_RADIO',
          teamId: car.teamId,
          teamColor: car.primaryColor,
          textTr: `"Öndeki araçla fark ${car.gapToAhead.toFixed(1)} sn. Plan B’ye geçiyoruz, lastik aşınması beklediğimizden yüksek."`,
          textEn: `"Gap ahead is ${car.gapToAhead.toFixed(1)}s. Switching to Plan B, deg is higher than expected."`,
          priority: 'normal',
        });
      }

      // Rare Mechanical Failure or Safety Car Trigger
      if (prevProgress < 1 && Math.random() < (100 - perf.coolingAndReliability) * 0.00025) {
        car.status = 'OUT';
        car.dnfReason = 'Güç Ünitesi / Hidrolik Arızası';
        trackStatus = Math.random() < 0.5 ? 'SC' : 'VSC';
        statusTimerSec = 28;
        radioMessages.unshift({
          id: `sc_${car.driverId}_${car.currentLap}`,
          lap: car.currentLap,
          timestamp: `T${car.currentLap}`,
          senderName: 'FIA Yarış Kontrol',
          senderRole: 'FIA',
          teamId: 'fia',
          teamColor: '#eab308',
          textTr: `SARI BAYRAK / ${trackStatus}: ${car.driverName} (${team.shortName}) teknik arıza nedeniyle pist kenarında durdu! Pit penceresi fırsatı!`,
          textEn: `${trackStatus} DEPLOYED: ${car.driverName} stopped on track with a mechanical failure!`,
          priority: 'urgent',
        });
      }

      // Occasional Steward Track Limits or Contact Investigation
      if (Math.random() < 0.015) {
        car.warningsTrackLimits += 1;
        if (car.warningsTrackLimits >= 3) {
          car.timePenaltySec += 5;
          car.warningsTrackLimits = 0;
          stewardIncidents.unshift({
            id: `inc_${car.driverId}_${car.currentLap}`,
            lap: car.currentLap,
            involvedDrivers: [car.driverName],
            typeTr: 'Pist Sınırları İhlali (4. İhlal)',
            typeEn: 'Track Limits Violation',
            decisionTr: '+5 Saniye Zaman Cezası (FIA Komiserler Kurulu)',
            decisionEn: '+5 Seconds Time Penalty',
            penaltySec: 5,
            resolved: true,
          });
        }
      }
    }
  });

  // Sort positions by total distance covered (currentLap + trackProgress) and compute gaps
  const runningCars = cars.filter((c) => c.status !== 'OUT');
  const outCars = cars.filter((c) => c.status === 'OUT');

  runningCars.sort((a, b) => {
    const distA = a.currentLap + a.trackProgress - a.timePenaltySec * 0.002;
    const distB = b.currentLap + b.trackProgress - b.timePenaltySec * 0.002;
    return distB - distA;
  });

  // Check if player teammates should swap positions when teamOrder === 'letTeammatePass'
  for (let i = 0; i < runningCars.length - 1; i++) {
    const ahead = runningCars[i];
    const behind = runningCars[i + 1];
    if (ahead.teamId === behind.teamId && ahead.teamOrder === 'letTeammatePass') {
      const tempProg = ahead.trackProgress;
      ahead.trackProgress = Math.max(0.01, behind.trackProgress - 0.005);
      behind.trackProgress = tempProg + 0.005;
      ahead.teamOrder = 'free';
      runningCars[i] = behind;
      runningCars[i + 1] = ahead;
    }
  }

  const leaderDist = runningCars[0] ? runningCars[0].currentLap + runningCars[0].trackProgress : 1;
  runningCars.forEach((c, idx) => {
    c.position = idx + 1;
    const myDist = c.currentLap + c.trackProgress;
    c.gapToLeader = idx === 0 ? 0 : Number(((leaderDist - myDist) * circuit.baseLapTimeSec).toFixed(2));
    if (idx === 0) {
      c.gapToAhead = 0;
    } else {
      const aheadDist = runningCars[idx - 1].currentLap + runningCars[idx - 1].trackProgress;
      c.gapToAhead = Number(Math.max(0.1, (aheadDist - myDist) * circuit.baseLapTimeSec).toFixed(2));
    }
  });

  outCars.forEach((c, idx) => {
    c.position = runningCars.length + idx + 1;
  });

  const sortedAll = [...runningCars, ...outCars];
  const maxLap = runningCars[0]?.currentLap || bundle.currentLap;
  const isFinished = maxLap > bundle.totalLaps;

  if (isFinished && !bundle.isFinished) {
    const winner = runningCars[0];
    radioMessages.unshift({
      id: 'race_finish_msg',
      lap: bundle.totalLaps,
      timestamp: 'DAMALI BAYRAK',
      senderName: 'FIA Yarış Kontrol',
      senderRole: 'FIA',
      teamId: 'fia',
      teamColor: '#22c55e',
      textTr: `DAMALI BAYRAK! ${circuit.name} Grand Prix’sini ${winner.driverName} (${winner.teamName}) kazandı! En hızlı tur: ${formatLapTime(overallBestLap)}.`,
      textEn: `CHEQUERED FLAG! ${winner.driverName} (${winner.teamName}) wins the ${circuit.name} Grand Prix!`,
      priority: 'urgent',
    });
  }

  return {
    ...bundle,
    currentLap: Math.min(bundle.totalLaps, maxLap),
    sessionElapsedSec,
    trackStatus,
    statusTimerSec,
    weather,
    trackWaterLevel,
    overallBestLap,
    overallBestS1,
    overallBestS2,
    overallBestS3,
    cars: sortedAll,
    radioMessages: radioMessages.slice(0, 45),
    stewardIncidents: stewardIncidents.slice(0, 20),
    isFinished,
  };
}

export function processPlayerRadioCommand(
  bundle: RaceSessionBundle,
  targetDriverId: string,
  commandText: string,
  state: CareerState
): { updatedBundle: RaceSessionBundle; spokenReplyTr: string } {
  const lower = commandText.toLowerCase();
  const cars = bundle.cars.map((c) => ({ ...c }));
  const car = cars.find((c) => c.driverId === targetDriverId);
  const drv = state.drivers.find((d) => d.id === targetDriverId);

  if (!car || !drv) {
    return { updatedBundle: bundle, spokenReplyTr: '' };
  }

  let replyTr = 'Anlaşıldı, talimatı uyguluyorum.';
  let replyEn = 'Copy that, executing instruction.';

  if (lower.includes('pit') || lower.includes('box') || lower.includes('piste gir') || lower.includes('pite gel')) {
    car.pitThisLap = true;
    if (lower.includes('yumuşak') || lower.includes('soft')) car.requestedPitCompound = 'soft';
    else if (lower.includes('sert') || lower.includes('hard')) car.requestedPitCompound = 'hard';
    else if (lower.includes('inter') || lower.includes('geçiş')) car.requestedPitCompound = 'intermediate';
    else if (lower.includes('wet') || lower.includes('yağmur')) car.requestedPitCompound = 'wet';
    else car.requestedPitCompound = 'medium';

    replyTr = `Anlaşıldı, bu tur sonunda pite geliyorum (${car.requestedPitCompound.toUpperCase()} lastik hazır olsun).`;
    replyEn = `Copy, boxing at the end of this lap for ${car.requestedPitCompound}s.`;
  } else if (lower.includes('pistte kal') || lower.includes('stay out') || lower.includes('iptal')) {
    car.pitThisLap = false;
    car.requestedPitCompound = null;
    replyTr = 'Anlaşıldı, pistte kalıyorum ve tempomu koruyorum.';
    replyEn = 'Copy, staying out on track.';
  } else if (lower.includes('bas') || lower.includes('push') || lower.includes('hızlan') || lower.includes('saldır') || lower.includes('attack')) {
    car.paceMode = 'attack';
    car.ersMode = 'overtake';
    replyTr = drv.personality.includes('Aggressive')
      ? 'Bunu duymayı bekliyordum! Tam güç saldırıyorum, bataryayı boşaltıyorum!'
      : 'Anlaşıldı, maksimum tempoya ve geçiş moduna çıktım.';
    replyEn = 'Copy, pushing maximum pace and deploying overtake ERS.';
  } else if (lower.includes('koru') || lower.includes('save') || lower.includes('yavaş') || lower.includes('lastik')) {
    car.paceMode = 'conserve';
    car.ersMode = 'harvest';
    replyTr = 'Tamamdır, viraj girişlerinde lastikleri soğutup bataryayı şarj ediyorum.';
    replyEn = 'Understood, managing tire temperatures and harvesting energy.';
  } else if (lower.includes('yakıt') || lower.includes('fuel') || lower.includes('lift')) {
    car.fuelMode = 'lean';
    replyTr = 'Lift and coast yapıyorum, yakıt tüketimini düşürdüm.';
    replyEn = 'Copy, lifting and coasting to save fuel.';
  } else if (lower.includes('yol ver') || lower.includes('pass') || lower.includes('swap') || lower.includes('takım emri')) {
    car.teamOrder = 'letTeammatePass';
    replyTr = drv.personality.includes('Team-oriented')
      ? 'Anlaşıldı, takım çıkarı için düzlükte takım arkadaşıma yer bırakacağım.'
      : 'Pek memnun değilim ama anlaşıldı, bu tur yol veriyorum.';
    replyEn = 'Copy, letting my teammate through on the straight.';
  } else if (lower.includes('savun') || lower.includes('defend')) {
    car.teamOrder = 'defendHard';
    car.ersMode = 'defend';
    replyTr = 'İç çizgiyi kapatıyorum, arkadaki aracı kesinlikle geçirmeyeceğim!';
    replyEn = 'Defending position with everything we have!';
  } else {
    replyTr = `"${commandText}" mesajı alındı. Mevcut tur zamanım ${formatLapTime(car.lastLapTime)}, lastik durumum %${Math.round(car.tireWear)}.`;
    replyEn = `Copy "${commandText}". Last lap ${formatLapTime(car.lastLapTime)}, tires at ${Math.round(car.tireWear)}%.`;
  }

  const engineerMsg: RadioMessage = {
    id: `cmd_eng_${Date.now()}`,
    lap: bundle.currentLap,
    timestamp: `T${bundle.currentLap}`,
    senderName: `${state.playerName} -> ${car.driverShort}`,
    senderRole: 'PRINCIPAL',
    teamId: car.teamId,
    teamColor: car.primaryColor,
    textTr: `Pit Duvarı: "${commandText}"`,
    textEn: `Pit Wall: "${commandText}"`,
    priority: 'strategy',
  };

  const driverReply: RadioMessage = {
    id: `cmd_drv_${Date.now() + 1}`,
    lap: bundle.currentLap,
    timestamp: `T${bundle.currentLap}`,
    senderName: car.driverName,
    senderRole: 'DRIVER',
    teamId: car.teamId,
    teamColor: car.primaryColor,
    textTr: `${car.driverName}: "${replyTr}"`,
    textEn: `${car.driverName}: "${replyEn}"`,
    priority: 'strategy',
  };

  return {
    updatedBundle: {
      ...bundle,
      cars,
      radioMessages: [driverReply, engineerMsg, ...bundle.radioMessages].slice(0, 45),
    },
    spokenReplyTr: replyTr,
  };
}
