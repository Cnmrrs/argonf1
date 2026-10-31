import React, { useState } from 'react';
import {
  CarConceptType,
  CareerState,
  DriverEntity,
  LiveryDesign,
  LogoDesign,
  SurfaceFinish,
  TeamEntity,
} from '../core/types';
import { ThreeCarAndTrack, CameraPreset } from '../rendering/ThreeCarAndTrack';
import { TeamLogoSvg } from './TeamLogoSvg';
import { calculateTeamCarPerformance } from '../simulation/simulationEngine';
import { soundEngine } from '../audio/soundEngine';

interface DesignStudioProps {
  team: TeamEntity;
  drivers: DriverEntity[];
  staff: CareerState['staff'];
  onUpdateTeam: (updatedTeam: TeamEntity, updatedDrivers?: DriverEntity[]) => void;
  onClose?: () => void;
}

type StudioTab =
  | 'livery'
  | 'logo'
  | 'engineering'
  | 'helmet'
  | 'uniformGarage'
  | 'library'
  | 'presentation';

export const DesignStudioView: React.FC<DesignStudioProps> = ({
  team,
  drivers,
  staff,
  onUpdateTeam,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('livery');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('broadcast');
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [hideControlsDock, setHideControlsDock] = useState<boolean>(false);
  const [viewMode2D, setViewMode2D] = useState<boolean>(false);

  const teamDrivers = drivers.filter((d) => d.teamId === team.id);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(teamDrivers[0]?.id || drivers[0]?.id);
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  const [livery, setLivery] = useState<LiveryDesign>(team.livery);
  const [logo, setLogo] = useState<LogoDesign>(team.logo);
  const [uniform, setUniform] = useState(team.uniform);
  const [garage, setGarage] = useState(team.garage);
  const [concept, setConcept] = useState<CarConceptType>(team.carConcept);

  const perf = calculateTeamCarPerformance({ ...team, carConcept: concept }, staff);

  const handleSaveAllChanges = () => {
    soundEngine.playClick();
    const updatedTeam: TeamEntity = {
      ...team,
      livery,
      logo,
      uniform,
      garage,
      carConcept: concept,
      savedLiveries: team.savedLiveries.some((l) => l.id === livery.id)
        ? team.savedLiveries.map((l) => (l.id === livery.id ? livery : l))
        : [{ ...livery, id: `liv_${Date.now()}` }, ...team.savedLiveries],
      savedLogos: team.savedLogos.some((lg) => lg.id === logo.id)
        ? team.savedLogos.map((lg) => (lg.id === logo.id ? logo : lg))
        : [{ ...logo, id: `log_${Date.now()}` }, ...team.savedLogos],
    };
    onUpdateTeam(updatedTeam);
  };

  const handleExportLogoSvg = () => {
    const svgEl = document.getElementById('studio-export-logo-svg')?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${team.shortName.toLowerCase()}_logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadCustomLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogo({ ...logo, customImageDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const updateDriverHelmet = (patch: Partial<DriverEntity['helmetDesign']>) => {
    if (!selectedDriver) return;
    const updatedList = drivers.map((d) =>
      d.id === selectedDriver.id
        ? { ...d, helmetDesign: { ...d.helmetDesign, ...patch } }
        : d
    );
    onUpdateTeam(team, updatedList);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div id="studio-export-logo-svg">
            <TeamLogoSvg logo={logo} size={42} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white font-display">
              {team.name} — Yaratıcı Tasarım & Mühendislik Stüdyosu
            </h2>
            <p className="text-xs text-slate-400">
              Görsel Kimlik (Livery, Logo, Kask, Tulum) ile Mühendislik Performansı birbirinden bağımsız çalışır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              ['livery', 'Araç Livery (Boya)'],
              ['logo', 'Logo Editörü'],
              ['engineering', 'Konsept & Mühendislik'],
              ['helmet', 'Pilot Kaskları'],
              ['uniformGarage', 'Tulum & Garaj'],
              ['library', 'Tasarım Kütüphanesi'],
              ['presentation', 'Sunum Modu'],
            ] as Array<[StudioTab, string]>
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tabKey);
                if (tabKey === 'helmet') setCameraPreset('helmet');
                else if (tabKey === 'engineering') setExplodedFactor(0.45);
                else {
                  setExplodedFactor(0);
                  setCameraPreset('broadcast');
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tabKey
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleSaveAllChanges}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Tasarımı Uygula & Kaydet
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md whitespace-nowrap shrink-0"
            >
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body: 3D/2D Viewport + Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[540px]">
        {/* Left/Center 3D Showroom Viewport */}
        <div
          className={`relative ${
            activeTab === 'presentation' ? 'lg:col-span-12' : 'lg:col-span-7'
          } h-[420px] lg:h-full bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800`}
        >
          {viewMode2D ? (
            /* 2D Top & Side Orthographic Technical Blueprint Livery Preview */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950">
              <div className="text-xs font-mono text-slate-400 mb-3">
                2B TEKNİK LIVERY ŞABLONU — {livery.name} ({livery.finish.toUpperCase()})
              </div>
              <svg viewBox="0 0 600 220" className="w-full max-w-xl border border-slate-800 rounded-lg bg-slate-900 p-4">
                {/* Side Profile F1 Car Vector */}
                <rect x="40" y="135" width="520" height="12" fill={livery.floorColor} rx="3" />
                <polygon
                  points="75,135 160,92 310,88 455,115 545,132 545,140 75,140"
                  fill={livery.mainBodyColor}
                  stroke={livery.accentColor}
                  strokeWidth="3"
                />
                <polygon points="150,92 265,62 290,90" fill={livery.secondaryColor} />
                {/* Sidepod */}
                <rect x="225" y="106" width="165" height="30" rx="8" fill={livery.sidepodColor} stroke={livery.accentColor} strokeWidth="2" />
                <text x="305" y="125" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="Chakra Petch">
                  {livery.titleSponsorText}
                </text>
                {/* Rear & Front Wing */}
                <rect x="52" y="72" width="38" height="62" rx="4" fill={livery.rearWingColor} stroke={livery.accentColor} strokeWidth="2" />
                <rect x="515" y="124" width="46" height="20" rx="3" fill={livery.frontWingColor} />
                {/* Halo & Helmet */}
                <path d="M295 90 Q335 72 365 95" fill="none" stroke={livery.haloColor} strokeWidth="6" />
                <circle cx="320" cy="86" r="11" fill={selectedDriver?.helmetDesign.baseColor || livery.accentColor} />
                {/* Wheels */}
                <circle cx="130" cy="138" r="32" fill="#171717" stroke={livery.wheelCoverColor} strokeWidth="5" />
                <circle cx="470" cy="138" r="32" fill="#171717" stroke={livery.wheelCoverColor} strokeWidth="5" />
              </svg>
            </div>
          ) : (
            <ThreeCarAndTrack
              mode="showroom"
              livery={livery}
              helmet={selectedDriver?.helmetDesign}
              cameraPreset={cameraPreset}
              explodedFactor={explodedFactor}
            />
          )}

          {/* Top-Left Minimal Spec Overlay (pointer-events-none) */}
          <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs">
            <div className="font-semibold text-white">{livery.name}</div>
            <div className="text-slate-400 font-mono tabular-nums">
              Yüzey: {livery.finish.toUpperCase()} · Konsept: {concept.toUpperCase()} · Ağırlık: {perf.totalWeightKg} kg
            </div>
          </div>

          {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion Rule) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-3xl flex flex-col items-center">
            <button
              onClick={() => setHideControlsDock(!hideControlsDock)}
              className="px-3 py-1 text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700 rounded-t-md hover:text-white"
            >
              {hideControlsDock ? '▴ Kamera & Stüdyo Kontrollerini Göster' : '▾ Kontrolleri Gizle (Sinema Modu)'}
            </button>
            {!hideControlsDock && (
              <div className="w-full bg-slate-900/95 border border-slate-700 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      ['broadcast', '360° Turntable'],
                      ['front', 'Ön'],
                      ['side', 'Yan'],
                      ['rear', 'Arka'],
                      ['top', 'Üst'],
                      ['helmet', 'Kokpit & Kask'],
                    ] as Array<[CameraPreset, string]>
                  ).map(([preset, lbl]) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setViewMode2D(false);
                        setCameraPreset(preset);
                      }}
                      className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                        !viewMode2D && cameraPreset === preset
                          ? 'bg-rose-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                  <button
                    onClick={() => setViewMode2D(!viewMode2D)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                      viewMode2D ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {viewMode2D ? '3B Sahneye Dön' : '2B Şablon'}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 whitespace-nowrap">Parça Ayrıştırma (Exploded):</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explodedFactor}
                    onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                    className="w-24 accent-rose-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Customization Controls Panel */}
        {activeTab !== 'presentation' && (
          <div className="lg:col-span-5 p-5 overflow-y-auto max-h-[640px] space-y-5 bg-slate-900/60">
            {activeTab === 'livery' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  B. Formula 1 Araç Livery (Renk, Kaplama & Sponsor) Editörü
                </h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Livery Şablon Adı & Gövde Yazısı</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={livery.name}
                      onChange={(e) => setLivery({ ...livery, name: e.target.value })}
                      className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                      placeholder="Livery Adı"
                    />
                    <input
                      type="text"
                      value={livery.titleSponsorText}
                      onChange={(e) => setLivery({ ...livery, titleSponsorText: e.target.value })}
                      className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                      placeholder="Sidepod Sponsor Metni"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(
                    [
                      ['mainBodyColor', 'Ana Gövde & Burun'],
                      ['secondaryColor', 'İkincil / Motor Kapağı'],
                      ['accentColor', 'Vurgu & Şerit Rengi'],
                      ['frontWingColor', 'Ön/Arka Kanat'],
                      ['haloColor', 'Halo Koruma'],
                      ['wheelCoverColor', 'Jant Kapakları'],
                    ] as Array<[keyof LiveryDesign, string]>
                  ).map(([field, label]) => (
                    <div key={field} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <label className="block text-[11px] text-slate-400 mb-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={String(livery[field])}
                          onChange={(e) => setLivery({ ...livery, [field]: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={String(livery[field])}
                          onChange={(e) => setLivery({ ...livery, [field]: e.target.value })}
                          className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Boya Yüzey Kaplaması (Finish)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ['metallic', 'Metalik'],
                        ['matte', 'Mat'],
                        ['gloss', 'Parlak (Gloss)'],
                        ['carbon', 'Karbon Fiber'],
                      ] as Array<[SurfaceFinish, string]>
                    ).map(([fin, lbl]) => (
                      <button
                        key={fin}
                        onClick={() => setLivery({ ...livery, finish: fin })}
                        className={`py-2 text-xs font-medium rounded border transition-colors ${
                          livery.finish === fin
                            ? 'bg-rose-600/20 border-rose-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logo' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  A. Takım Amblemi & Çok Katmanlı SVG Logo Tasarımcısı
                </h3>
                <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <TeamLogoSvg logo={logo} size={76} />
                  <div className="space-y-2 flex-1">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Takım Kısaltması (Initials)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={logo.initials}
                        onChange={(e) => setLogo({ ...logo, initials: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleExportLogoSvg}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                      >
                        SVG Olarak İndir
                      </button>
                      <label className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer">
                        Özel Görsel Yükle
                        <input type="file" accept="image/*" onChange={handleUploadCustomLogo} className="hidden" />
                      </label>
                      {logo.customImageDataUrl && (
                        <button
                          onClick={() => setLogo({ ...logo, customImageDataUrl: undefined })}
                          className="px-2 py-1 text-xs text-rose-400 hover:underline"
                        >
                          Görseli Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kalkan / Çerçeve Şekli</label>
                    <select
                      value={logo.bgShape}
                      onChange={(e) => setLogo({ ...logo, bgShape: e.target.value as LogoDesign['bgShape'] })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                    >
                      <option value="shield">Klasik Kalkan (Shield)</option>
                      <option value="hexagon">Altıgen (Hexagon)</option>
                      <option value="crest">Şampiyonluk Arması (Crest)</option>
                      <option value="octagon">Sekizgen (Octagon)</option>
                      <option value="circle">Madalyon Daire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Merkez Sembol</label>
                    <select
                      value={logo.symbol}
                      onChange={(e) => setLogo({ ...logo, symbol: e.target.value as LogoDesign['symbol'] })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                    >
                      <option value="crescent">Ay Yıldız (Crescent)</option>
                      <option value="wing">Aero Kanat (Wing)</option>
                      <option value="falcon">Anadolu Şahini (Falcon)</option>
                      <option value="bolt">Yıldırım (ERS Bolt)</option>
                      <option value="star">Şampiyonluk Yıldızı</option>
                      <option value="chequered">Damalı Bayrak</option>
                      <option value="turbine">Turbo Türbin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Ana Renk</label>
                    <input
                      type="color"
                      value={logo.primaryColor}
                      onChange={(e) => setLogo({ ...logo, primaryColor: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Gradyan Renk</label>
                    <input
                      type="color"
                      value={logo.secondaryColor}
                      onChange={(e) => setLogo({ ...logo, secondaryColor: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Sembol & Sınır</label>
                    <input
                      type="color"
                      value={logo.accentColor}
                      onChange={(e) => setLogo({ ...logo, accentColor: e.target.value, borderColor: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'engineering' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  C & D. Araç Felsefesi & Mühendislik Konsepti (Performans Etkili)
                </h3>
                <p className="text-xs text-slate-400">
                  Teknik departmanınızın aerodinamik ve şasi konseptini seçin. Her konseptin farklı pist tiplerinde avantaj ve dezavantajları vardır.
                </p>

                <div className="space-y-2">
                  {(
                    [
                      ['balanced', 'Dengeli Konsept (Balanced)', 'Tüm pist tiplerinde öngörülebilir aerodinamik ve mekanik denge.'],
                      ['highDownforce', 'Yüksek Yere Basma Gücü (High-Downforce)', 'Monako ve İstanbul Park 8. viraj gibi hızlı/teknik virajlarda +3.5 Aero, düzlüklerde -2.2 hız.'],
                      ['lowDrag', 'Düşük Sürtünme (Low-Drag)', 'Monza ve Spa düzlüklerinde +4.0 son hız, dar virajlarda ve lastik aşınmasında ödün.'],
                      ['tireFriendly', 'Lastik Dostu Şasi (Tire-Friendly)', 'Yüksek aşındırıcı pistlerde +4.5 lastik ömrü ve tek pit strateji avantajı.'],
                      ['highSpeed', 'Yüksek Hızlı Pist Paketi (High-Speed)', 'Düzlük performansı yüksek, yavaş şikanlarda mekanik tutunma orta seviyede.'],
                    ] as Array<[CarConceptType, string, string]>
                  ).map(([cKey, title, desc]) => (
                    <button
                      key={cKey}
                      onClick={() => setConcept(cKey)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        concept === cKey
                          ? 'bg-rose-600/15 border-rose-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>

                {/* Live Calculated Engineering Performance Readout */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Hesaplanan Mühendislik Verileri (Genel: {perf.overall}/100)
                  </div>
                  {(
                    [
                      ['Aerodinamik Verimlilik', perf.aerodynamics],
                      ['Düzlük Hızı (Low-Drag + ICE)', perf.straightLineSpeed],
                      ['Viraj & Mekanik Tutunma', perf.corneringGrip],
                      ['Lastik Koruma İndeksi', perf.tirePreservation],
                      ['Soğutma & Dayanıklılık', perf.coolingAndReliability],
                    ] as Array<[string, number]>
                  ).map(([lbl, val]) => (
                    <div key={lbl} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono tabular-nums">
                        <span className="text-slate-400">{lbl}</span>
                        <span className="text-white font-semibold">{val}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'helmet' && selectedDriver && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  F. Pilot Kask Tasarımcısı
                </h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Pilot Seçin</label>
                  <select
                    value={selectedDriver.id}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                  >
                    {teamDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.number} {d.name} ({d.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDriver.prefersPersonalHelmet && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                    Not: {selectedDriver.name} kendi ikonik kask renklerini korumayı tercih ediyor, ancak takım patronu olarak vizör ve şerit detaylarını güncelleyebilirsiniz.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Kask Ana Renk</label>
                    <input
                      type="color"
                      value={selectedDriver.helmetDesign.baseColor}
                      onChange={(e) => updateDriverHelmet({ baseColor: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Desen Şeridi</label>
                    <input
                      type="color"
                      value={selectedDriver.helmetDesign.stripeColor}
                      onChange={(e) => updateDriverHelmet({ stripeColor: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">İridyum Vizör</label>
                    <input
                      type="color"
                      value={selectedDriver.helmetDesign.visorTint}
                      onChange={(e) => updateDriverHelmet({ visorTint: e.target.value })}
                      className="w-full h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'uniformGarage' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  E & G. Pilot Tulumu, Pit Ekibi & Garaj Ortamı
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <label className="block text-xs text-slate-400 mb-1">Yarış Tulumu Ana Renk</label>
                    <input
                      type="color"
                      value={uniform.suitPrimaryColor}
                      onChange={(e) => setUniform({ ...uniform, suitPrimaryColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <label className="block text-xs text-slate-400 mb-1">Eldiven & Ayakkabı Vurgusu</label>
                    <input
                      type="color"
                      value={uniform.gloveColor}
                      onChange={(e) => setUniform({ ...uniform, gloveColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <label className="block text-xs text-slate-400 mb-1">Garaj Duvar Kaplaması</label>
                    <input
                      type="color"
                      value={garage.wallColor}
                      onChange={(e) => setGarage({ ...garage, wallColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <label className="block text-xs text-slate-400 mb-1">Garaj LED Aydınlatma</label>
                    <input
                      type="color"
                      value={garage.lightingColor}
                      onChange={(e) => setGarage({ ...garage, lightingColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  H. Kayıtlı Tasarım Kütüphanesi & Şablonlar
                </h3>
                <div className="space-y-2">
                  {team.savedLiveries.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full border border-white/20"
                          style={{ backgroundColor: saved.mainBodyColor }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{saved.name}</div>
                          <div className="text-[11px] text-slate-400">{saved.finish.toUpperCase()}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setLivery(saved)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-rose-600 text-white rounded transition-colors"
                      >
                        Yükle
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
