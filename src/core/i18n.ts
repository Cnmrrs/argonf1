import { Language } from './types';

export const translations = {
  tr: {
    appTitle: 'ARGON F1',
    appSubtitle: 'Takım Patronu, Organizasyon & Yarış Simülatörü',
    startCareer: 'Kariyere Başla',
    continueCareer: 'Kariyere Devam Et',
    loadSave: 'Kayıt Yükle / Yedekler',
    designStudio: 'Tasarım Stüdyosu',
    settings: 'Ayarlar',
    language: 'Dil',
    theme: 'Tema',
    audio: 'Ses Efektleri',
    voiceRadio: 'Sesli Telsiz',
    // Game Modes
    selectGameMode: 'Oyun Modu ve Sezon Seçimi',
    modeOwnerTitle: 'Takım Sahibi Kariyeri',
    modeOwnerDesc: 'Takımın tüm mülkiyeti sizde. Yatırımcıları yönetin, bütçeyi belirleyin ve nihai otorite olarak imparatorluğunuzu kurun.',
    modePrincipalTitle: 'Takım Patronu Kariyeri',
    modePrincipalDesc: 'Yönetim kuruluna ve yatırımcılara karşı sorumlusunuz. Hedefleri tutturun, Cost Cap sınırına uyun; aksi halde görevden alınabilirsiniz.',
    modeHistoricalTitle: 'Tarihsel Sezon Modu (2000–2026)',
    modeHistoricalDesc: 'V10 döneminden (2000-2005) Brawn GP mucizesine (2009), 2021 rekabetinden 2026 Aktif Aero kurallarına kadar döneme özgü kurallarla yarışın.',
    modeScenarioTitle: 'Senaryo Mücadeleleri',
    modeScenarioDesc: 'Finansal krizdeki bir takımı kurtarma, yıldız pilot ayrılığı sonrası yeniden yapılanma veya kısıtlı bütçeyle podyum mücadelesi.',
    modeSandboxTitle: 'Sandbox (Serbest) Mod',
    modeSandboxDesc: 'Bütçe sınırlarını, FIA kurallarını, sakatlıkları ve yönetim kurulu baskısını dilediğiniz gibi özelleştirin.',
    // Team Selection
    selectOrCreateTeam: 'Takım Seçimi veya Yeni Takım Kurulumu',
    manageExistingTeam: 'Mevcut Bir Takımı Yönet',
    createCustomTeam: 'Özel Takım Kur ("Senin Takımın")',
    customTeamDefaultName: 'Senin Takımın',
    // HQ Tabs
    hqDashboard: 'Karargah Özeti',
    hqDrivers: 'Pilotlar & Akademi',
    hqStaff: 'Personel & Departmanlar',
    hqCarDev: 'Ar-Ge & Mühendislik',
    hqDesignStudio: 'Tasarım Stüdyosu (3B)',
    hqFacilities: 'Tesisler & Altyapı',
    hqFinance: 'Finans, Sponsor & Cost Cap',
    hqTransfer: 'Transfer Pazarı',
    hqBoardMedia: 'Yönetim Kurulu, Medya & FIA',
    hqStandings: 'Şampiyona & Takvim',
    hqSaves: 'Kayıt & Yedekleme',
    // Actions
    advanceWeek: 'Sonraki Haftaya İlerle',
    goToRaceWeekend: 'Yarış Hafta Sonuna Git',
    negotiateContract: 'Sözleşme Müzakeresi',
    saveGame: 'Oyunu Kaydet',
    exportBackup: 'JSON Yedek İndir',
    importBackup: 'Yedek Yükle',
  },
  en: {
    appTitle: 'ARGON F1',
    appSubtitle: 'Team Principal, Management & Racing Simulator',
    startCareer: 'Start Career',
    continueCareer: 'Continue Career',
    loadSave: 'Load Save / Backups',
    designStudio: 'Design Studio',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    audio: 'Sound Effects',
    voiceRadio: 'Voice Radio',
    // Game Modes
    selectGameMode: 'Game Mode & Season Selection',
    modeOwnerTitle: 'Team Owner Career',
    modeOwnerDesc: 'Own the entire racing organization. Manage investors, control capital allocation, and hold final authority over every decision.',
    modePrincipalTitle: 'Team Principal Career',
    modePrincipalDesc: 'Answer to the board of directors and investors. Deliver results and obey the FIA Cost Cap, or face dismissal.',
    modeHistoricalTitle: 'Historical Season Mode (2000–2026)',
    modeHistoricalDesc: 'Compete across F1 eras from V10 screaming engines (2000-2005) and Brawn GP (2009) to 2021 and 2026 Active Aero regulations.',
    modeScenarioTitle: 'Scenario Challenges',
    modeScenarioDesc: 'Save a bankrupt team, rebuild after your lead driver departs, or fight for podiums on a shoestring budget.',
    modeSandboxTitle: 'Sandbox Mode',
    modeSandboxDesc: 'Customize budgets, FIA cost caps, injuries, and board dismissal rules without career restrictions.',
    // Team Selection
    selectOrCreateTeam: 'Select Existing Team or Create Custom Team',
    manageExistingTeam: 'Manage Existing Team',
    createCustomTeam: 'Create Custom Team ("Senin Takımın")',
    customTeamDefaultName: 'Senin Takımın',
    // HQ Tabs
    hqDashboard: 'HQ Overview',
    hqDrivers: 'Drivers & Academy',
    hqStaff: 'Staff & Departments',
    hqCarDev: 'R&D & Engineering',
    hqDesignStudio: 'Design Studio (3D)',
    hqFacilities: 'Facilities & Infrastructure',
    hqFinance: 'Finance, Sponsors & Cost Cap',
    hqTransfer: 'Transfer Market',
    hqBoardMedia: 'Boardroom, Media & FIA',
    hqStandings: 'Standings & Calendar',
    hqSaves: 'Saves & Backups',
    // Actions
    advanceWeek: 'Advance Week',
    goToRaceWeekend: 'Enter Race Weekend',
    negotiateContract: 'Negotiate Contract',
    saveGame: 'Save Game',
    exportBackup: 'Export JSON Backup',
    importBackup: 'Import Backup',
  },
};

export function t(lang: Language, key: keyof typeof translations['tr']): string {
  return translations[lang][key] || translations.tr[key];
}

export function formatCurrency(amount: number, lang: Language = 'tr'): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${abs.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}`;
}

export function formatLapTime(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const secStr = secs < 10 ? `0${secs.toFixed(3)}` : secs.toFixed(3);
  return `${mins}:${secStr}`;
}
