import React, { useEffect, useState } from 'react';
import {
  CareerState,
  CarSetup,
  ErsMode,
  FuelMode,
  PaceMode,
  TireCompound,
} from '../core/types';
import {
  initializeRaceSession,
  processPlayerRadioCommand,
  RaceSessionBundle,
  stepRaceSimulation,
} from '../race-engine/raceSimulator';
import { ThreeCarAndTrack, CameraPreset } from '../rendering/ThreeCarAndTrack';
import { formatLapTime } from '../core/i18n';
import { soundEngine } from '../audio/soundEngine';

interface RaceWeekendViewProps {
  state: CareerState;
  onUpdateSetup: (driverId: string, setup: CarSetup) => void;
  onCompleteRaceWeekend: (
    finalBundle: RaceSessionBundle,
    interviewChoice: 'praiseTeam' | 'demandMoreAero' | 'criticizeStewards'
  ) => void;
  onExitWithoutFinishing: () => void;
}

type WeekendPhase = 'setup_practice' | 'qualifying_grid' | 'live_race' | 'post_race';
type BroadcastChannel = 'main' | 'timing' | 'onboard' | 'pitlane' | 'radio' | 'fia';

export const RaceWeekendView: React.FC<RaceWeekendViewProps> = ({
  state,
  onUpdateSetup,
  onCompleteRaceWeekend,
  onExitWithoutFinishing,
}) => {
  const circuit = state.calendar[state.currentRoundIndex % state.calendar.length];
  const playerTeam = state.teams.find((t) => t.id === state.playerTeamId)!;
  const playerDrivers = state.drivers
    .filter((d) => d.teamId === playerTeam.id && d.healthStatus !== 'unavailable')
    .slice(0, 2);

  const [phase, setPhase] = useState<WeekendPhase>('setup_practice');
  const [bundle, setBundle] = useState<RaceSessionBundle>(() =>
    initializeRaceSession(state, circuit)
  );
  const [simSpeed, setSimSpeed] = useState<0 | 1 | 2 | 5 | 12>(0);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('broadcast');
  const [channel, setChannel] = useState<BroadcastChannel>('main');
  const [focusedDriverId, setFocusedDriverId] = useState<string>(
    playerDrivers[0]?.id || bundle.cars[0]?.driverId || ''
  );
  const [selectedRadioDriverId, setSelectedRadioDriverId] = useState<string>(
    playerDrivers[0]?.id || ''
  );
  const [customRadioText, setCustomRadioText] = useState<string>('');
  const [hideBottomDock, setHideBottomDock] = useState<boolean>(false);
  const [interviewChoice, setInterviewChoice] = useState<
    'praiseTeam' | 'demandMoreAero' | 'criticizeStewards'
  >('praiseTeam');

  // Re-initialize race session after practice setup updates
  const handleStartQualifying = () => {
    soundEngine.playClick();
    const fresh = initializeRaceSession(state, circuit);
    setBundle(fresh);
    setPhase('qualifying_grid');
  };

  const handleStartLiveRace = () => {
    soundEngine.playClick();
    soundEngine.playEnginePulse(12500, state.seasonYear <= 2005);
    setPhase('live_race');
    setSimSpeed(1);
  };

  const handleInstantSimulateRace = () => {
    soundEngine.playClick();
    let current = initializeRaceSession(state, circuit);
    let safetyCounter = 0;
    while (!current.isFinished && safetyCounter < 4500) {
      current = stepRaceSimulation(current, state, 2.5);
      safetyCounter++;
    }
    setBundle(current);
    setSimSpeed(0);
    setPhase('post_race');
  };

  // Real-time simulation interval in live_race
  useEffect(() => {
    if (phase !== 'live_race' || simSpeed === 0 || bundle.isFinished) return;

    const intervalMs = 200;
    const timer = window.setInterval(() => {
      setBundle((prev) => {
        if (prev.isFinished) return prev;
        const next = stepRaceSimulation(prev, state, 0.35 * simSpeed);
        if (next.isFinished) {
          setSimSpeed(0);
          setPhase('post_race');
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [phase, simSpeed, bundle.isFinished, state]);

  const updateCarStrategy = (
    driverId: string,
    patch: Partial<{
      paceMode: PaceMode;
      ersMode: ErsMode;
      fuelMode: FuelMode;
      pitThisLap: boolean;
      requestedPitCompound: TireCompound | null;
      teamOrder: 'free' | 'holdPosition' | 'letTeammatePass' | 'defendHard';
    }>
  ) => {
    soundEngine.playClick();
    setBundle((prev) => ({
      ...prev,
      cars: prev.cars.map((c) => (c.driverId === driverId ? { ...c, ...patch } : c)),
    }));
  };

  const handleSendRadio = (text: string) => {
    if (!text.trim() || !selectedRadioDriverId) return;
    const { updatedBundle, spokenReplyTr } = processPlayerRadioCommand(
      bundle,
      selectedRadioDriverId,
      text.trim(),
      state
    );
    setBundle(updatedBundle);
    setCustomRadioText('');
    if (spokenReplyTr) {
      soundEngine.speakRadioMessage(spokenReplyTr, 'tr');
    }
  };

  const focusedCar =
    bundle.cars.find((c) => c.driverId === focusedDriverId) || bundle.cars[0];

  const renderCompoundBadge = (comp: TireCompound) => {
    const map: Record<TireCompound, { letter: string; color: string }> = {
      soft: { letter: 'S', color: 'text-rose-500 border-rose-500' },
      medium: { letter: 'M', color: 'text-amber-400 border-amber-400' },
      hard: { letter: 'H', color: 'text-slate-100 border-slate-300' },
      intermediate: { letter: 'I', color: 'text-emerald-400 border-emerald-400' },
      wet: { letter: 'W', color: 'text-sky-400 border-sky-400' },
    };
    const item = map[comp];
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold border rounded-full ${item.color}`}
      >
        {item.letter}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Broadcast Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">{circuit.flag}</span>
          <div>
            <div className="text-sm font-bold text-white font-display tracking-wide">
              {circuit.name.toUpperCase()} — {state.seasonYear} GRAND PRIX
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              Tur: {bundle.currentLap}/{bundle.totalLaps} · Pist: {circuit.lengthKm} km · Hava:{' '}
              {bundle.weather} ({bundle.trackTempC}°C Pist / %{Math.round(bundle.trackWaterLevel)} Islaklık)
            </div>
          </div>
        </div>

        {/* Track Status Flag Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider ${
              bundle.trackStatus === 'GREEN'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : bundle.trackStatus === 'SC' || bundle.trackStatus === 'VSC'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-rose-600 text-white'
            }`}
          >
            PİST DURUMU: {bundle.trackStatus === 'GREEN' ? 'YEŞİL BAYRAK' : bundle.trackStatus}
          </div>

          {phase === 'live_race' && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {([0, 1, 2, 5, 12] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    simSpeed === spd
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd === 0 ? 'DURAKLAT' : `${spd}x`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onExitWithoutFinishing}
            className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
          >
            Karargaha Dön
          </button>
        </div>
      </div>

      {/* PHASE 1: PRACTICE & SETUP TUNING */}
      {phase === 'setup_practice' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-mono text-rose-400">
                1., 2. VE 3. ANTRENMAN SEANSLARI · ARAÇ KURULUMU (SETUP) VE LASTİK TESTİ
              </div>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                {circuit.name} Hafta Sonu Hazırlığı
              </h2>
              <p className="text-xs text-slate-400 mt-1">{bundle.forecastTextTr}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartQualifying}
                className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
              >
                Sıralama Turlarına (Qualifying) Geç
              </button>
              <button
                onClick={handleInstantSimulateRace}
                className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                Tüm Hafta Sonunu Hızlı Simüle Et
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playerDrivers.map((drv) => {
              const setup = state.carSetups[drv.id] || {
                frontWingAngle: 55,
                rearWingAngle: 53,
                antiRollBar: 50,
                tirePressurePsi: 22.5,
                brakeBiasRear: 56,
                setupConfidence: 78,
              };
              const idealWing = Math.round(circuit.downforceSensitivity * 85);

              const handleSlider = (field: keyof CarSetup, val: number) => {
                const next = { ...setup, [field]: val };
                const diff =
                  Math.abs(next.frontWingAngle - idealWing) +
                  Math.abs(next.rearWingAngle - idealWing);
                const conf = Math.min(100, Math.max(55, Math.round(98 - diff * 0.45)));
                onUpdateSetup(drv.id, { ...next, setupConfidence: conf });
              };

              return (
                <div
                  key={drv.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-base font-bold text-white font-display">
                        #{drv.number} {drv.name} ({drv.role.toUpperCase()})
                      </div>
                      <div className="text-xs text-slate-400">
                        Geri Bildirim Kalitesi: {drv.feedback}/100 · Fiziksel Durum: {drv.fitness}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Kurulum Uyumu</div>
                      <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                        %{setup.setupConfidence}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">
                          Ön Kanat Açısı (Hedef Bölge: ~{idealWing})
                        </span>
                        <span className="font-mono text-white">{setup.frontWingAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={95}
                        value={setup.frontWingAngle}
                        onChange={(e) => handleSlider('frontWingAngle', Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">
                          Arka Kanat & DRS Dengesi (Hedef: ~{idealWing})
                        </span>
                        <span className="font-mono text-white">{setup.rearWingAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={95}
                        value={setup.rearWingAngle}
                        onChange={(e) => handleSlider('rearWingAngle', Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Süspansiyon & Viraj Denge Çubuğu (Anti-Roll)</span>
                        <span className="font-mono text-white">{setup.antiRollBar}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={85}
                        value={setup.antiRollBar}
                        onChange={(e) => handleSlider('antiRollBar', Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Fren Dengesi (Ön/Arka Dağılımı)</span>
                        <span className="font-mono text-white">%{setup.brakeBiasRear}</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={64}
                        value={setup.brakeBiasRear}
                        onChange={(e) => handleSlider('brakeBiasRear', Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-white">Pilot Telsiz Geri Bildirimi:</strong> "
                    {setup.setupConfidence >= 90
                      ? 'Araç viraj girişlerinde rayda gidiyor gibi, sıralama turları için harika bir denge yakaladık!'
                      : setup.frontWingAngle < idealWing - 10
                      ? 'Yüksek hızlı virajlarda önden kayma (understeer) yaşıyorum, kanat açısını biraz artırmamız lazım.'
                      : 'Genel denge fena değil ancak kerblerde aracın arkası biraz huzursuz.'}
                    "
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PHASE 2: QUALIFYING RESULTS & STARTING GRID */}
      {phase === 'qualifying_grid' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-mono text-emerald-400">
                Q1 · Q2 · Q3 SIRALAMA TURLARI SONUÇLARI (STARTING GRID)
              </div>
              <h2 className="text-xl font-bold text-white font-display mt-0.5">
                {circuit.name} Başlangıç Dizilişi
              </h2>
            </div>
            <button
              onClick={handleStartLiveRace}
              className="px-6 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
            >
              Beş Kırmızı Işık — Canlı Yarışı Başlat!
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                  <th className="py-2.5 px-4">Sıra</th>
                  <th className="py-2.5 px-4">Pilot</th>
                  <th className="py-2.5 px-4">Takım</th>
                  <th className="py-2.5 px-4 text-right">Q3 Tur Zamanı</th>
                  <th className="py-2.5 px-4 text-right">Fark</th>
                  <th className="py-2.5 px-4 text-center">Başlangıç Lastiği</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {bundle.cars.map((c, idx) => {
                  const poleTime = bundle.cars[0].lastLapTime;
                  const diff = c.lastLapTime - poleTime;
                  const isPlayer = c.teamId === state.playerTeamId;
                  return (
                    <tr
                      key={c.driverId}
                      className={isPlayer ? 'bg-rose-950/30 text-white font-semibold' : 'hover:bg-slate-800/40'}
                    >
                      <td className="py-2 px-4 font-bold">P{idx + 1}</td>
                      <td className="py-2 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-4 rounded-sm"
                            style={{ backgroundColor: c.primaryColor }}
                          />
                          <span>
                            #{c.driverNumber} {c.driverName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 font-sans text-slate-300">{c.teamName}</td>
                      <td className="py-2 px-4 text-right">{formatLapTime(c.lastLapTime)}</td>
                      <td className="py-2 px-4 text-right text-slate-400">
                        {idx === 0 ? 'POLE' : `+${diff.toFixed(3)}s`}
                      </td>
                      <td className="py-2 px-4 text-center">{renderCompoundBadge(c.tireCompound)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PHASE 3: LIVE RACE BROADCAST SCREEN */}
      {phase === 'live_race' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* LEFT: F1 TV-INSPIRED LIVE TIMING TOWER */}
          <div className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 max-h-60 lg:max-h-full">
            <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>CANLI ZAMANLAMA KULESİ</span>
              <span>EN HIZLI: {formatLapTime(bundle.overallBestLap)}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {bundle.cars.map((c) => {
                const isPlayer = c.teamId === state.playerTeamId;
                const isFocused = c.driverId === focusedDriverId;
                return (
                  <button
                    key={c.driverId}
                    onClick={() => setFocusedDriverId(c.driverId)}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-xs font-mono tabular-nums transition-colors ${
                      isFocused
                        ? 'bg-slate-800 text-white'
                        : isPlayer
                        ? 'bg-rose-950/25 text-rose-100 hover:bg-slate-800/70'
                        : 'text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-left font-bold text-slate-400">{c.position}</span>
                      <span
                        className="w-1 h-4 rounded-sm shrink-0"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      <span className="font-bold tracking-tight">{c.driverShort}</span>
                      {isPlayer && (
                        <span className="text-[10px] font-sans text-rose-400 font-semibold">SİZ</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mini sector bars */}
                      <div className="flex items-center gap-0.5">
                        {([c.sector1Color, c.sector2Color, c.sector3Color] as const).map(
                          (sc, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-2.5 rounded-xs ${
                                sc === 'purple'
                                  ? 'bg-purple-500'
                                  : sc === 'green'
                                  ? 'bg-emerald-500'
                                  : sc === 'yellow'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-700'
                              }`}
                            />
                          )
                        )}
                      </div>

                      <span className="w-14 text-right text-[11px]">
                        {c.status === 'OUT'
                          ? 'DNF'
                          : c.inPit
                          ? 'PİT'
                          : c.position === 1
                          ? 'LİDER'
                          : `+${c.gapToAhead.toFixed(1)}s`}
                      </span>

                      {renderCompoundBadge(c.tireCompound)}
                      <span
                        className={`w-8 text-right text-[11px] ${
                          c.tireWear < 35 ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {Math.round(c.tireWear)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: 85%+ UNOBSTRUCTED 3D / 2D VIEWPORT + MULTI-CHANNEL BROADCAST */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
            {/* Top Channel & Camera Bar */}
            <div className="z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
              {/* Broadcast Information Channels */}
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  [
                    ['main', 'Canlı Yayın (Pist)'],
                    ['timing', 'Detaylı Sektör & Telemetri'],
                    ['onboard', 'Onboard Kokpit Kanalı'],
                    ['pitlane', 'Pit Yolu Kanalı'],
                    ['radio', `Takım & Rakip Telsizler (${bundle.radioMessages.length})`],
                    ['fia', `FIA & Komiserler (${bundle.stewardIncidents.length})`],
                  ] as Array<[BroadcastChannel, string]>
                ).map(([chKey, lbl]) => (
                  <button
                    key={chKey}
                    onClick={() => {
                      setChannel(chKey);
                      if (chKey === 'onboard') setCameraPreset('cockpit');
                      if (chKey === 'pitlane') setCameraPreset('pitlane');
                    }}
                    className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 ${
                      channel === chKey
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* 2D vs 3D Mode & Camera Selector */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
                  className="px-2.5 py-1 font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0"
                >
                  {viewMode === '3D' ? '2B TAKTİK HARİTAYA GEÇ' : '3B THREE.JS SAHNEYE GEÇ'}
                </button>
                {viewMode === '3D' && (
                  <select
                    value={cameraPreset}
                    onChange={(e) => setCameraPreset(e.target.value as CameraPreset)}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                  >
                    <option value="broadcast">TV Yayın Kamerası (Broadcast)</option>
                    <option value="onboard">T-Cam Onboard Kamera</option>
                    <option value="cockpit">Kokpit (Pilot Gözü)</option>
                    <option value="nose">Ön Kanat / Burun Kamerası</option>
                    <option value="rear">Arka Kanat Kamerası</option>
                    <option value="side">Yan Süspansiyon Kamerası</option>
                    <option value="helicopter">Helikopter Kamerası</option>
                    <option value="trackside">Pist Kenarı Kamerası</option>
                    <option value="pitlane">Pit Yolu Kamerası</option>
                    <option value="free">Serbest Kamera (Fare ile Döndür)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 relative overflow-hidden">
              {channel === 'timing' ? (
                <div className="p-5 overflow-y-auto h-full bg-slate-950">
                  <h3 className="text-sm font-bold text-white mb-3 font-display">
                    CANLI SEKTÖR, LASTİK SICAKLIĞI, ERS VE PİT PENCERESİ ANALİZİ
                  </h3>
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                        <th className="p-2">Sıra</th>
                        <th className="p-2">Pilot</th>
                        <th className="p-2 text-right">Son Tur</th>
                        <th className="p-2 text-right">En İyi</th>
                        <th className="p-2 text-right">S1</th>
                        <th className="p-2 text-right">S2</th>
                        <th className="p-2 text-right">S3</th>
                        <th className="p-2 text-center">Lastik / Yaş</th>
                        <th className="p-2 text-right">Sıcaklık</th>
                        <th className="p-2 text-right">ERS / Yakıt</th>
                        <th className="p-2 text-right">Pit / Ceza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {bundle.cars.map((c) => (
                        <tr
                          key={c.driverId}
                          className={
                            c.teamId === state.playerTeamId
                              ? 'bg-rose-950/30 text-white'
                              : 'text-slate-300'
                          }
                        >
                          <td className="p-2 font-bold">P{c.position}</td>
                          <td className="p-2 font-sans font-semibold">{c.driverName}</td>
                          <td className="p-2 text-right">{formatLapTime(c.lastLapTime)}</td>
                          <td className="p-2 text-right text-purple-400">
                            {formatLapTime(c.bestLapTime)}
                          </td>
                          <td className="p-2 text-right">{c.sector1Time.toFixed(3)}</td>
                          <td className="p-2 text-right">{c.sector2Time.toFixed(3)}</td>
                          <td className="p-2 text-right">{c.sector3Time.toFixed(3)}</td>
                          <td className="p-2 text-center">
                            {renderCompoundBadge(c.tireCompound)} ({c.tireAgeLaps}T)
                          </td>
                          <td className="p-2 text-right">{c.tireTempC}°C</td>
                          <td className="p-2 text-right">
                            %{Math.round(c.ersBattery)} · {c.fuelKg.toFixed(1)}kg
                          </td>
                          <td className="p-2 text-right">
                            {c.pitStopsCount} Pit{' '}
                            {c.timePenaltySec > 0 ? `(+${c.timePenaltySec}s)` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : channel === 'radio' ? (
                <div className="p-5 overflow-y-auto h-full bg-slate-950 space-y-2.5">
                  <h3 className="text-sm font-bold text-white mb-2 font-display">
                    CANLI TAKIM TELSİZİ & RAKİP FREKANS DİNLEME KANALI (TÜRKÇE ALTYAZILI)
                  </h3>
                  {bundle.radioMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: msg.teamColor }}
                          />
                          <span className="font-bold text-white">{msg.senderName}</span>
                          <span className="text-slate-400 font-mono">· Tur {msg.lap}</span>
                        </div>
                        <div className="text-slate-200">{msg.textTr}</div>
                      </div>
                      <button
                        onClick={() => soundEngine.speakRadioMessage(msg.textTr, 'tr')}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0"
                      >
                        Sesli Dinle
                      </button>
                    </div>
                  ))}
                </div>
              ) : channel === 'fia' ? (
                <div className="p-5 overflow-y-auto h-full bg-slate-950 space-y-3">
                  <h3 className="text-sm font-bold text-white font-display">
                    FIA YARIŞ KONTROL & KOMİSERLER KURULU (STEWARDS) KARARLARI
                  </h3>
                  {bundle.stewardIncidents.length === 0 ? (
                    <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                      Şu ana kadar ceza gerektiren bir kural ihlali kaydedilmedi. Pist sınırları denetimi devam ediyor.
                    </div>
                  ) : (
                    bundle.stewardIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-amber-400">
                            Tur {inc.lap} · {inc.typeTr} — {inc.involvedDrivers.join(', ')}
                          </div>
                          <div className="text-slate-300 mt-0.5">{inc.decisionTr}</div>
                        </div>
                        <span className="font-mono font-bold text-rose-400">
                          +{inc.penaltySec} SN
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : viewMode === '2D' ? (
                /* 2D Interactive Top-Down Circuit Map */
                <div className="w-full h-full flex items-center justify-center bg-slate-950 p-4">
                  <svg viewBox="-115 -70 230 140" className="w-full h-full max-w-4xl">
                    {/* Track Outline */}
                    <polygon
                      points={circuit.waypoints.map((w) => `${w.x},${w.z}`).join(' ')}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="7"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={circuit.waypoints.map((w) => `${w.x},${w.z}`).join(' ')}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    {/* Moving Car Dots */}
                    {bundle.cars.map((c) => {
                      if (c.status === 'OUT') return null;
                      const totalWp = circuit.waypoints.length;
                      const exactIdx = ((c.trackProgress % 1) + 1) % 1 * totalWp;
                      const i0 = Math.floor(exactIdx) % totalWp;
                      const i1 = (i0 + 1) % totalWp;
                      const frac = exactIdx - Math.floor(exactIdx);
                      const p0 = circuit.waypoints[i0];
                      const p1 = circuit.waypoints[i1];
                      const cx = p0.x + (p1.x - p0.x) * frac;
                      const cz = p0.z + (p1.z - p0.z) * frac;
                      const isPlayer = c.teamId === state.playerTeamId;
                      return (
                        <g key={c.driverId} transform={`translate(${cx}, ${cz})`}>
                          <circle
                            r={isPlayer ? 4.2 : 2.8}
                            fill={c.primaryColor}
                            stroke="#ffffff"
                            strokeWidth={isPlayer ? 1.2 : 0.5}
                          />
                          <text
                            y={-5.5}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={isPlayer ? '4.5' : '3.5'}
                            fontFamily="JetBrains Mono"
                            fontWeight="bold"
                          >
                            {c.driverShort}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                /* 3D Three.js Track & Cars Viewport */
                <ThreeCarAndTrack
                  mode="race"
                  circuit={circuit}
                  cars={bundle.cars}
                  focusedDriverId={focusedDriverId}
                  cameraPreset={cameraPreset}
                  weather={bundle.weather}
                />
              )}

              {/* Focused Car Telemetry HUD Cluster (Top-Right, pointer-events-none, no backdrop-filter) */}
              {focusedCar && (
                <div className="absolute top-3 right-3 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono tabular-nums space-y-1">
                  <div className="flex items-center justify-between gap-4 font-sans font-bold text-white">
                    <span>
                      P{focusedCar.position} · #{focusedCar.driverNumber} {focusedCar.driverName}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                        focusedCar.drsActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      DRS {focusedCar.drsActive ? 'AÇIK' : 'KAPALI'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span>HIZ: <strong className="text-cyan-400">{focusedCar.speedKmh} km/s</strong></span>
                    <span>VİTES: <strong className="text-white">{focusedCar.gear}</strong></span>
                    <span>RPM: <strong className="text-rose-400">{focusedCar.rpm}</strong></span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>ERS: %{Math.round(focusedCar.ersBattery)}</span>
                    <span>YAKIT: {focusedCar.fuelKg.toFixed(1)} kg</span>
                    <span>LASTİK: %{Math.round(focusedCar.tireWear)} ({focusedCar.tireTempC}°C)</span>
                  </div>
                </div>
              )}

              {/* COLLAPSIBLE BOTTOM PIT-WALL STRATEGY & TEAM RADIO DOCK */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-6xl flex flex-col items-center">
                <button
                  onClick={() => setHideBottomDock(!hideBottomDock)}
                  className="px-3.5 py-1 text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700 rounded-t-md hover:text-white"
                >
                  {hideBottomDock
                    ? '▴ Pit Duvarı Strateji & Telsiz Konsolunu Aç'
                    : '▾ Pit Duvarını Gizle (Tam Ekran Pist Görünümü)'}
                </button>

                {!hideBottomDock && (
                  <div className="w-full bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-2xl space-y-2.5">
                    {/* Player Cars Live Strategy Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {playerDrivers.map((drv) => {
                        const car = bundle.cars.find((c) => c.driverId === drv.id);
                        if (!car) return null;
                        return (
                          <div
                            key={drv.id}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-rose-400">P{car.position}</span>
                              <span className="font-bold text-white">{car.driverName}</span>
                              {renderCompoundBadge(car.tireCompound)}
                              <span className="font-mono text-slate-400">%{Math.round(car.tireWear)}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Pace Mode */}
                              <select
                                value={car.paceMode}
                                onChange={(e) =>
                                  updateCarStrategy(drv.id, { paceMode: e.target.value as PaceMode })
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                              >
                                <option value="conserve">Tempo: Lastik Koru</option>
                                <option value="standard">Tempo: Dengeli</option>
                                <option value="push">Tempo: Zorla (Push)</option>
                                <option value="attack">Tempo: Maksimum Saldırı</option>
                              </select>

                              {/* ERS Mode */}
                              <select
                                value={car.ersMode}
                                onChange={(e) =>
                                  updateCarStrategy(drv.id, { ersMode: e.target.value as ErsMode })
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                              >
                                <option value="harvest">ERS: Şarj Et</option>
                                <option value="balanced">ERS: Dengeli</option>
                                <option value="overtake">ERS: Geçiş (Overtake)</option>
                                <option value="defend">ERS: Savunma</option>
                              </select>

                              {/* Pit Stop Compound & Call */}
                              <select
                                value={car.requestedPitCompound || 'medium'}
                                onChange={(e) =>
                                  updateCarStrategy(drv.id, {
                                    requestedPitCompound: e.target.value as TireCompound,
                                    pitThisLap: true,
                                  })
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                              >
                                <option value="soft">Pit: Yumuşak (S)</option>
                                <option value="medium">Pit: Orta (M)</option>
                                <option value="hard">Pit: Sert (H)</option>
                                <option value="intermediate">Pit: Geçiş (I)</option>
                                <option value="wet">Pit: Yağmur (W)</option>
                              </select>

                              <button
                                onClick={() =>
                                  updateCarStrategy(drv.id, {
                                    pitThisLap: !car.pitThisLap,
                                    requestedPitCompound: car.requestedPitCompound || 'medium',
                                  })
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                                  car.pitThisLap
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                {car.pitThisLap ? 'PİT EMRİ AKTİF (İptal)' : 'BU TUR PİTE GİR'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Team Radio Command Bar (Preset + Free-Form Text) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-xs">
                      <select
                        value={selectedRadioDriverId}
                        onChange={(e) => setSelectedRadioDriverId(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-semibold"
                      >
                        {playerDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            Telsiz Hedefi: {d.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 flex-wrap">
                        {[
                          'Daha hızlı sür, tam güç saldır!',
                          'Lastikleri koru ve soğut',
                          'Bu tur pite gel',
                          'Pistte kal (Stay out)',
                          'Pozisyonunu savun',
                          'Takım arkadaşına yol ver',
                        ].map((presetCmd) => (
                          <button
                            key={presetCmd}
                            onClick={() => handleSendRadio(presetCmd)}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded whitespace-nowrap"
                          >
                            {presetCmd}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 flex items-center gap-1.5 min-w-[220px]">
                        <input
                          type="text"
                          value={customRadioText}
                          onChange={(e) => setCustomRadioText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendRadio(customRadioText);
                          }}
                          placeholder="Pilotunuza serbest telsiz mesajı yazın ve Enter'a basın..."
                          className="flex-1 px-3 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                        />
                        <button
                          onClick={() => handleSendRadio(customRadioText)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded whitespace-nowrap"
                        >
                          Telsiz Gönder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: POST-RACE CLASSIFICATION, STEWARDS & PRESS CONFERENCE */}
      {phase === 'post_race' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400">
                  DAMALI BAYRAK · RESMİ FIA YARIŞ SONUÇLARI VE BASIN TOPLANTISI
                </span>
                <h2 className="text-2xl font-bold text-white font-display mt-0.5">
                  {circuit.name} Grand Prix — Yarış Sonu Raporu
                </h2>
              </div>
              <button
                onClick={() => onCompleteRaceWeekend(bundle, interviewChoice)}
                className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Puanları Kaydet & Karargaha Dön
              </button>
            </div>

            {/* Post-Race Media Press Conference Selection */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-rose-400">
                YARIŞ SONU BASIN TOPLANTISI — Medya Demecinizi Seçin:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {(
                  [
                    [
                      'praiseTeam',
                      'Pilotları ve Pit Ekibini Öv',
                      'Takım morali +6, Sponsor memnuniyeti +4',
                    ],
                    [
                      'demandMoreAero',
                      'Fabrikadan Acil Ar-Ge Atılımı İste',
                      'Mühendislik odaklanması artar, Yönetim kurulu beklentisi korunur',
                    ],
                    [
                      'criticizeStewards',
                      'FIA Hakem Kararlarını ve Rakipleri Eleştir',
                      'Taraftar ilgisi artar, FIA ile politik gerilim oluşur',
                    ],
                  ] as const
                ).map(([key, title, effect]) => (
                  <button
                    key={key}
                    onClick={() => setInterviewChoice(key)}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                      interviewChoice === key
                        ? 'bg-rose-600/20 border-rose-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">{title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{effect}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Final Classification Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                    <th className="py-2.5 px-3">Poz</th>
                    <th className="py-2.5 px-3">Pilot</th>
                    <th className="py-2.5 px-3">Takım</th>
                    <th className="py-2.5 px-3 text-right">Fark / Durum</th>
                    <th className="py-2.5 px-3 text-right">En İyi Tur</th>
                    <th className="py-2.5 px-3 text-center">Pit</th>
                    <th className="py-2.5 px-3 text-right">Kazanılan Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {bundle.cars.map((c, idx) => {
                    const pts =
                      c.status === 'OUT'
                        ? 0
                        : state.regulations.pointsSystem[idx] || 0;
                    const isPlayer = c.teamId === state.playerTeamId;
                    return (
                      <tr
                        key={c.driverId}
                        className={
                          isPlayer ? 'bg-rose-950/35 text-white font-semibold' : 'text-slate-300'
                        }
                      >
                        <td className="py-2 px-3 font-bold">P{idx + 1}</td>
                        <td className="py-2 px-3 font-sans">{c.driverName}</td>
                        <td className="py-2 px-3 font-sans">{c.teamName}</td>
                        <td className="py-2 px-3 text-right">
                          {c.status === 'OUT'
                            ? `DNF (${c.dnfReason || 'Arıza'})`
                            : idx === 0
                            ? 'KAZANAN'
                            : `+${c.gapToLeader.toFixed(2)}s`}
                        </td>
                        <td className="py-2 px-3 text-right">{formatLapTime(c.bestLapTime)}</td>
                        <td className="py-2 px-3 text-center">{c.pitStopsCount}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {pts > 0 ? `+${pts}` : '0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
