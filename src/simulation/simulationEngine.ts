import {
  CarPartType,
  CareerState,
  ContractTerms,
  DriverEntity,
  FacilityType,
  InboxEvent,
  StaffEntity,
  TeamEntity,
} from '../core/types';
import { formatCurrency } from '../core/i18n';

export interface CarPerformanceSummary {
  overall: number;
  aerodynamics: number;
  straightLineSpeed: number;
  corneringGrip: number;
  tirePreservation: number;
  coolingAndReliability: number;
  totalWeightKg: number;
}

export function calculateTeamCarPerformance(
  team: TeamEntity,
  staffList: StaffEntity[] = []
): CarPerformanceSummary {
  const parts = Object.values(team.parts);
  const avg = (fn: (p: typeof parts[number]) => number) =>
    parts.reduce((acc, p) => acc + fn(p), 0) / parts.length;

  const teamStaff = staffList.filter((s) => s.teamId === team.id && s.onGardeningLeaveUntilWeek <= 0);
  const techDirector = teamStaff.find((s) => s.role === 'Technical Director');
  const chiefAero = teamStaff.find((s) => s.role === 'Chief Aerodynamicist');
  const staffBonus = ((techDirector?.technicalSkill || 75) + (chiefAero?.technicalSkill || 75) - 150) * 0.08;

  let aero = (avg((p) => p.aeroEfficiency) + avg((p) => p.downforce)) / 2 + staffBonus;
  let speed = (avg((p) => p.dragReduction) + team.parts.engine.powerOutput + team.parts.ers.powerOutput) / 3;
  let grip = (avg((p) => p.mechanicalGrip) + team.parts.suspension.mechanicalGrip + team.parts.floor.downforce) / 3;
  let tire = avg((p) => p.tirePreservation);
  let rel = (avg((p) => p.reliability) + team.parts.cooling.coolingEfficiency) / 2;

  // Apply Car Concept modifiers
  if (team.carConcept === 'highDownforce') {
    aero += 3.5;
    grip += 2.5;
    speed -= 2.2;
  } else if (team.carConcept === 'lowDrag') {
    speed += 4.0;
    aero -= 1.8;
    tire -= 1.0;
  } else if (team.carConcept === 'tireFriendly') {
    tire += 4.5;
    rel += 1.5;
    speed -= 1.2;
  } else if (team.carConcept === 'highSpeed') {
    speed += 3.2;
    grip -= 1.5;
  }

  const totalWeightKg = parts.reduce((acc, p) => acc + p.weightKg, 455); // 455kg base survival cell + halo + fuel tank
  const weightPenalty = Math.max(0, (totalWeightKg - 798) * 0.25);

  const clamp = (v: number) => Math.max(40, Math.min(99, Math.round(v - weightPenalty)));
  const aerodynamics = clamp(aero);
  const straightLineSpeed = clamp(speed);
  const corneringGrip = clamp(grip);
  const tirePreservation = clamp(tire);
  const coolingAndReliability = clamp(rel);
  const overall = Math.round(
    aerodynamics * 0.28 +
      straightLineSpeed * 0.24 +
      corneringGrip * 0.22 +
      tirePreservation * 0.14 +
      coolingAndReliability * 0.12
  );

  return {
    overall,
    aerodynamics,
    straightLineSpeed,
    corneringGrip,
    tirePreservation,
    coolingAndReliability,
    totalWeightKg,
  };
}

export interface NegotiationEvaluation {
  status: 'accepted' | 'counteroffer' | 'rejected';
  happinessScore: number; // 0-100
  messageTr: string;
  messageEn: string;
  counterTerms?: ContractTerms;
  competingTeamName?: string;
}

export function evaluateContractOffer(params: {
  target: DriverEntity | StaffEntity;
  isDriver: boolean;
  offeredTerms: ContractTerms;
  playerTeam: TeamEntity;
  allTeams: TeamEntity[];
  freeTextMessage: string;
  selectedDialogueTone: 'ambitious' | 'financial' | 'loyal' | 'pressure' | 'neutral';
}): NegotiationEvaluation {
  const { target, isDriver, offeredTerms, playerTeam, allTeams, freeTextMessage, selectedDialogueTone } = params;

  const baseDesiredSalary = isDriver
    ? Math.max(target.contract.annualSalary, (target as DriverEntity).marketValue * 0.85)
    : target.contract.annualSalary * 1.05;

  const salaryRatio = offeredTerms.annualSalary / Math.max(500_000, baseDesiredSalary);
  const bonusScore =
    (offeredTerms.signingBonus / Math.max(250_000, baseDesiredSalary * 0.15)) * 8 +
    (offeredTerms.championshipBonus / 1_500_000) * 5;

  const teamPerf = calculateTeamCarPerformance(playerTeam).overall;
  const repScore = (playerTeam.reputation - 75) * 0.45 + (teamPerf - 78) * 0.55;

  let roleScore = 0;
  if (isDriver) {
    const drv = target as DriverEntity;
    if (offeredTerms.guaranteedRole === 'lead') {
      roleScore += 14;
    } else if (offeredTerms.guaranteedRole === 'second' && drv.pace >= 90) {
      roleScore -= 18;
    } else if (offeredTerms.guaranteedRole === 'equal') {
      roleScore += 4;
    }
  }

  // Analyze free-form text and dialogue tone
  let textScore = 0;
  const lower = freeTextMessage.toLowerCase();
  if (
    lower.includes('şampiyon') ||
    lower.includes('champion') ||
    lower.includes('lider') ||
    lower.includes('birinci') ||
    lower.includes('rüzgar tüneli') ||
    lower.includes('gelişim') ||
    lower.includes('gelecek') ||
    lower.includes('proje')
  ) {
    textScore += 8;
  }
  if (lower.includes('kesinti') || lower.includes('itaat') || lower.includes('mecbur')) {
    textScore -= 10;
  }

  if (selectedDialogueTone === 'ambitious') textScore += 6;
  if (selectedDialogueTone === 'financial') textScore += 5;
  if (selectedDialogueTone === 'loyal') textScore += 4;
  if (selectedDialogueTone === 'pressure') textScore -= 6;

  const rawScore =
    salaryRatio * 58 +
    Math.min(18, bonusScore) +
    repScore +
    roleScore +
    textScore +
    (target.managementRelationship - 70) * 0.25;

  const happinessScore = Math.max(5, Math.min(100, Math.round(rawScore)));

  // Check if a rival team is competing
  const rivalTeams = allTeams.filter((t) => t.id !== playerTeam.id && t.reputation >= target.reputation - 8);
  const competingTeam = rivalTeams.length > 0 ? rivalTeams[0] : undefined;

  if (happinessScore >= 76) {
    return {
      status: 'accepted',
      happinessScore,
      messageTr: `${target.name} ve menajeri teklifinizi memnuniyetle kabul etti! "${playerTeam.name} projesine ve sunduğunuz vizyona tam güveniyoruz. Sözleşmeyi imzalamaya hazırız."`,
      messageEn: `${target.name} and their representative accepted your offer! "We believe in ${playerTeam.name}'s direction and are ready to sign."`,
    };
  }

  if (happinessScore >= 52) {
    const counterSalary = Math.round(Math.max(offeredTerms.annualSalary * 1.14, baseDesiredSalary * 1.04) / 50_000) * 50_000;
    const counterSigning = Math.round(Math.max(offeredTerms.signingBonus * 1.2, counterSalary * 0.18) / 25_000) * 25_000;
    const wantedRole =
      isDriver && (target as DriverEntity).pace >= 90 && offeredTerms.guaranteedRole === 'second'
        ? 'equal'
        : offeredTerms.guaranteedRole;

    const counterTerms: ContractTerms = {
      ...offeredTerms,
      annualSalary: counterSalary,
      signingBonus: counterSigning,
      durationYears: Math.min(3, offeredTerms.durationYears),
      guaranteedRole: wantedRole,
    };

    return {
      status: 'counteroffer',
      happinessScore,
      competingTeamName: competingTeam?.name,
      counterTerms,
      messageTr: `${target.name} temsilcisi karşı teklif sundu: "Takımınızın projesine sıcak bakıyoruz ancak ${
        competingTeam ? `${competingTeam.name} tarafından da ilgi var. ` : ''
      }Yıllık maaşın ${formatCurrency(counterSalary)} seviyesine ve imza priminin ${formatCurrency(counterSigning)} tutarına çekilmesini${
        wantedRole !== offeredTerms.guaranteedRole ? ', ayrıca en az Eşit Pilot statüsü garantisini' : ''
      } talep ediyoruz."`,
      messageEn: `${target.name}'s agent made a counteroffer: "We need an annual salary of ${formatCurrency(counterSalary)} and a signing bonus of ${formatCurrency(counterSigning)} to finalize the deal."`,
    };
  }

  return {
    status: 'rejected',
    happinessScore,
    competingTeamName: competingTeam?.name,
    messageTr: `${target.name} teklifi reddetti: "Önerdiğiniz mali şartlar ve takım içi rol beklentilerimizin oldukça altında. ${
      competingTeam ? `Şu anda ${competingTeam.name} ile çok daha rekabetçi bir paket görüşüyoruz.` : 'Şartlar iyileştirilmeden masaya oturmamız zor.'
    }"`,
    messageEn: `${target.name} rejected the offer: "The financial package and role guarantees are below our expectations."`,
  };
}

export function advanceCareerWeek(state: CareerState): CareerState {
  const nextWeek = state.currentWeek + 1;
  const teams = state.teams.map((t) => ({
    ...t,
    parts: { ...t.parts },
    facilities: { ...t.facilities },
    sponsors: t.sponsors.map((s) => ({ ...s })),
  }));
  const drivers = state.drivers.map((d) => ({ ...d }));
  const staff = state.staff.map((s) => ({
    ...s,
    onGardeningLeaveUntilWeek: Math.max(0, s.onGardeningLeaveUntilWeek - 1),
  }));
  const inbox: InboxEvent[] = [...state.inbox];
  const ledger = [...state.ledger];
  const transferRumors = [...state.transferRumors];

  const playerTeam = teams.find((t) => t.id === state.playerTeamId)!;

  // 1. Weekly Finances & Sponsor Income vs Payroll
  teams.forEach((team) => {
    const weeklySponsorIncome = Math.round(
      team.sponsors.reduce((sum, s) => sum + s.annualValue, 0) / 24
    );
    const teamDrivers = drivers.filter((d) => d.teamId === team.id);
    const teamStaff = staff.filter((s) => s.teamId === team.id);
    const weeklyPayroll = Math.round(
      (teamDrivers.reduce((sum, d) => sum + d.contract.annualSalary, 0) +
        teamStaff.reduce((sum, s) => sum + s.contract.annualSalary, 0)) /
        24
    );
    const weeklyFacilityMaint = Math.round(
      Object.values(team.facilities).reduce((sum, f) => sum + f.maintenanceCostPerMonth, 0) / 4
    );

    const netDelta = weeklySponsorIncome - weeklyPayroll - weeklyFacilityMaint;
    if (!(team.id === playerTeam.id && state.sandboxSettings.unlimitedBudget)) {
      team.budget += netDelta;
    }
    team.costCapSpent += Math.round(weeklyPayroll * 0.45 + weeklyFacilityMaint);

    if (team.id === playerTeam.id) {
      ledger.unshift(
        {
          id: `led_sp_${nextWeek}`,
          week: nextWeek,
          category: 'SPONSOR',
          descriptionTr: `Haftalık Sponsorluk Gelirleri (${team.sponsors.length} Aktif Sponsor)`,
          descriptionEn: `Weekly Sponsorship Revenue (${team.sponsors.length} Sponsors)`,
          amount: weeklySponsorIncome,
          countsTowardCostCap: false,
        },
        {
          id: `led_pay_${nextWeek}`,
          week: nextWeek,
          category: 'SALARY',
          descriptionTr: 'Haftalık Pilot, Mühendis & Fabrika Personeli Maaş Ödemeleri',
          descriptionEn: 'Weekly Driver & Staff Payroll',
          amount: -weeklyPayroll,
          countsTowardCostCap: true,
        },
        {
          id: `led_fac_${nextWeek}`,
          week: nextWeek,
          category: 'FACILITY',
          descriptionTr: 'Tesis, Rüzgar Tüneli ve CFD Haftalık Bakım Gideri',
          descriptionEn: 'Weekly Facility & Wind Tunnel Maintenance',
          amount: -weeklyFacilityMaint,
          countsTowardCostCap: true,
        }
      );
    }

    // 2. Progress R&D Part Developments
    (Object.keys(team.parts) as CarPartType[]).forEach((partKey) => {
      const part = { ...team.parts[partKey] };
      if (part.inDevelopment) {
        const dev = { ...part.inDevelopment, weeksRemaining: part.inDevelopment.weeksRemaining - 1 };
        if (dev.weeksRemaining <= 0) {
          const gain = dev.expectedGain;
          part.level += 1;
          part.aeroEfficiency = Math.min(99, part.aeroEfficiency + gain);
          part.downforce = Math.min(99, part.downforce + gain);
          part.dragReduction = Math.min(99, part.dragReduction + Math.max(1, gain - 1));
          part.mechanicalGrip = Math.min(99, part.mechanicalGrip + Math.max(1, gain - 1));
          part.powerOutput = Math.min(99, part.powerOutput + (partKey === 'engine' || partKey === 'ers' ? gain : 1));
          part.reliability = Math.max(55, Math.min(99, part.reliability + (dev.riskFactor > 0.5 ? -2 : 2)));
          part.spareCount += 2;
          delete part.inDevelopment;

          if (team.id === playerTeam.id) {
            inbox.unshift({
              id: `rd_done_${partKey}_${nextWeek}`,
              week: nextWeek,
              dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
              category: 'TECHNICAL',
              titleTr: `Ar-Ge Tamamlandı: ${part.nameTr} (Seviye ${part.level})`,
              titleEn: `R&D Completed: ${part.nameEn} (Spec ${part.level})`,
              bodyTr: `Mühendislik departmanımız ${part.nameTr} güncellemesini başarıyla üretti ve araçlara monte etti. Beklenen performans artışı: +${gain} puan.`,
              bodyEn: `Our engineering department completed and fitted the ${part.nameEn} Spec ${part.level} upgrade (+${gain} performance points).`,
              read: false,
            });
          }
        } else {
          part.inDevelopment = dev;
        }
      }
      team.parts[partKey] = part;
    });

    // 3. Progress Facility Upgrades
    (Object.keys(team.facilities) as FacilityType[]).forEach((facKey) => {
      const fac = { ...team.facilities[facKey] };
      if (fac.upgradeWeeksLeft > 0) {
        fac.upgradeWeeksLeft -= 1;
        if (fac.upgradeWeeksLeft === 0) {
          fac.level = Math.min(5, fac.level + 1);
          fac.condition = 100;
          if (team.id === playerTeam.id) {
            inbox.unshift({
              id: `fac_done_${facKey}_${nextWeek}`,
              week: nextWeek,
              dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
              category: 'TECHNICAL',
              titleTr: `Tesis Yükseltmesi Tamamlandı: ${fac.nameTr} (Seviye ${fac.level})`,
              titleEn: `Facility Upgrade Complete: ${fac.nameEn} (Level ${fac.level})`,
              bodyTr: `${fac.nameTr} inşaatı tamamlandı ve tam kapasiteyle devreye alındı.`,
              bodyEn: `${fac.nameEn} has been upgraded to Level ${fac.level}.`,
              read: false,
            });
          }
        }
      }
      team.facilities[facKey] = fac;
    });

    // 4. Independent AI Rival Teams Decision Loop
    if (team.id !== playerTeam.id) {
      const activeDevs = Object.values(team.parts).filter((p) => p.inDevelopment).length;
      if (activeDevs < 2 && team.budget > 12_000_000) {
        const partKeys: CarPartType[] = ['frontWing', 'floor', 'sidepods', 'engine', 'suspension', 'rearWing'];
        const chosenKey = partKeys[(nextWeek + team.name.length) % partKeys.length];
        const targetPart = team.parts[chosenKey];
        if (!targetPart.inDevelopment) {
          const isRisky = team.aiStrategyProfile === 'shortTermRisk' || team.aiStrategyProfile === 'aggressiveR&D';
          const cost = 1_800_000;
          team.budget -= cost;
          team.costCapSpent += cost;
          team.parts[chosenKey] = {
            ...targetPart,
            inDevelopment: {
              targetName: `${targetPart.nameTr} v${targetPart.level + 1}`,
              weeksRemaining: 2,
              totalWeeks: 2,
              expectedGain: isRisky ? 3 : 2,
              riskFactor: isRisky ? 0.65 : 0.2,
              costAllocated: cost,
            },
          };
        }
      }
    }
  });

  // 5. Driver Health, Recovery & Dynamic Medical/Personal Events
  const medicalFacilityLvl = playerTeam.facilities.fitnessMedical?.level || 2;
  drivers.forEach((drv) => {
    if (drv.recoveryWeeksLeft > 0) {
      drv.recoveryWeeksLeft = Math.max(0, drv.recoveryWeeksLeft - (medicalFacilityLvl >= 4 ? 2 : 1));
      if (drv.recoveryWeeksLeft === 0) {
        drv.healthStatus = 'healthy';
        drv.fitness = Math.min(100, drv.fitness + 12);
        drv.healthNoteTr = 'Tıbbi heyet onay verdi, yarışmaya tamamen hazır.';
        drv.healthNoteEn = 'Cleared by the medical team to return to competition.';
        if (drv.teamId === playerTeam.id) {
          inbox.unshift({
            id: `med_clear_${drv.id}_${nextWeek}`,
            week: nextWeek,
            dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
            category: 'MEDICAL',
            titleTr: `Tıbbi Rapor: ${drv.name} Pistlere Dönmeye Hazır`,
            titleEn: `Medical Clearance: ${drv.name} Fit to Race`,
            bodyTr: `Başhekimliğimiz ${drv.name} için rehabilitasyon sürecinin tamamlandığını ve hafta sonu kokpite geçebileceğini bildirdi.`,
            bodyEn: `${drv.name} has completed recovery and is cleared for race duties.`,
            read: false,
          });
        }
      }
    }
  });

  // Contextual Dynamic Events (Medical, Politics, Rival Poaching, FIA Cost Cap)
  if (!state.sandboxSettings.noDriverInjuries && nextWeek % 5 === 0) {
    const playerDrivers = drivers.filter((d) => d.teamId === playerTeam.id && d.role !== 'reserve' && d.healthStatus === 'healthy');
    if (playerDrivers.length > 0) {
      const affected = playerDrivers[nextWeek % playerDrivers.length];
      affected.healthStatus = 'illness';
      affected.recoveryWeeksLeft = 1;
      affected.fitness = Math.max(68, affected.fitness - 14);
      affected.healthNoteTr = 'Viral enfeksiyon ve yüksek ateş nedeniyle fiziksel kondisyon düşüşü (Yedek pilot değerlendirilebilir).';
      affected.healthNoteEn = 'Reduced physical condition due to viral fatigue (Reserve driver option available).';

      inbox.unshift({
        id: `med_event_${nextWeek}`,
        week: nextWeek,
        dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
        category: 'MEDICAL',
        titleTr: `Sağlık Uyarısı: ${affected.name} Kondisyon Kaybı Yaşıyor`,
        titleEn: `Medical Alert: ${affected.name} Experiencing Illness`,
        bodyTr: `${affected.name} yoğun seyahat programı sonrası soğuk algınlığı ve yorgunluk belirtileri gösteriyor. Doktorlarımız dinlenmesini veya bu hafta sonu yedek pilotumuzun kokpite geçmesini öneriyor.`,
        bodyEn: `${affected.name} is suffering from acute fatigue. You can rest them and field a reserve driver or run them at reduced fitness.`,
        read: false,
        actionRequired: true,
        choices: [
          {
            id: 'rest_driver_use_reserve',
            labelTr: 'Pilotu Dinlendir ve Yedek Pilotla Hazırlan (+Moral & Hızlı İyileşme)',
            labelEn: 'Rest Driver & Prepare Reserve (+Morale & Instant Recovery)',
            effectSummaryTr: 'Pilot tamamen iyileşir, Yedek pilot tecrübe kazanır',
            effectSummaryEn: 'Driver recovers immediately, reserve gains experience',
            moraleDelta: 6,
          },
          {
            id: 'keep_racing',
            labelTr: 'Özel Tıbbi Destekle Yarıştır (-$250K Tıbbi Ekip)',
            labelEn: 'Provide Intensive Medical Support (-$250K)',
            effectSummaryTr: 'Bütçe -$250K, pilot hafta sonuna katılabilir',
            effectSummaryEn: 'Budget -$250K, driver cleared to race',
            budgetDelta: -250_000,
          },
        ],
      });
    }
  }

  // Rival Team Staff Poaching / Internal Politics Event
  if (nextWeek % 3 === 0) {
    const rival = teams.find((t) => t.id !== playerTeam.id && t.reputation >= 85) || teams[1];
    const keyStaff = staff.find((s) => s.teamId === playerTeam.id && (s.role === 'Chief Aerodynamicist' || s.role === 'Technical Director'));
    if (rival && keyStaff) {
      inbox.unshift({
        id: `poach_${nextWeek}`,
        week: nextWeek,
        dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
        category: 'POLITICS',
        titleTr: `Transfer Tehdidi: ${rival.name}, ${keyStaff.name} İçin Devrede!`,
        titleEn: `Poaching Alert: ${rival.name} Approaches ${keyStaff.name}`,
        bodyTr: `${rival.name} üst yönetimi, ${keyStaff.role} pozisyonundaki kilit isminiz ${keyStaff.name} ile yüksek maaşlı bir teklif için temasa geçti. Müdahale etmezseniz personelinizin bağlılığı düşebilir.`,
        bodyEn: `${rival.name} has approached your ${keyStaff.role} ${keyStaff.name} with a lucrative offer.`,
        read: false,
        actionRequired: true,
        choices: [
          {
            id: 'counter_bonus',
            labelTr: 'Sadakat ve Performans Primi Öde (-$600K)',
            labelEn: 'Pay Retention Bonus (-$600K)',
            effectSummaryTr: 'Personel takımda kalır, Moral +10, Bütçe -$600K',
            effectSummaryEn: 'Staff stays, Morale +10, Budget -$600K',
            budgetDelta: -600_000,
            moraleDelta: 10,
          },
          {
            id: 'enforce_gardening',
            labelTr: 'Sözleşmedeki Gardening Leave (Zorunlu İzin) Maddesini Hatırlat',
            labelEn: 'Enforce Gardening Leave Clause',
            effectSummaryTr: 'Maliyet yok, ancak personel morali hafif etkilenebilir',
            effectSummaryEn: 'Zero cost, minor morale impact',
            moraleDelta: -2,
          },
        ],
      });
    }
  }

  // FIA Cost Cap Check
  if (
    state.regulations.costCapUsd &&
    !state.sandboxSettings.disableCostCap &&
    playerTeam.costCapSpent > state.regulations.costCapUsd * 0.92
  ) {
    inbox.unshift({
      id: `fia_cap_warn_${nextWeek}`,
      week: nextWeek,
      dateStr: `Hafta ${nextWeek} · ${state.seasonYear}`,
      category: 'FIA',
      titleTr: 'FIA Mali Denetim Kurulu: Cost Cap Sınırı Uyarısı',
      titleEn: 'FIA Financial Regulations: Cost Cap Threshold Warning',
      bodyTr: `Takımınızın yıllık Cost Cap harcaması ${formatCurrency(playerTeam.costCapSpent)} seviyesine ulaştı (Üst Sınır: ${formatCurrency(state.regulations.costCapUsd)}). Sınırın aşılması halinde para cezası, rüzgar tüneli kısıtlaması veya şampiyona puan silme cezası uygulanacaktır.`,
      bodyEn: `Your Cost Cap expenditure has reached ${formatCurrency(playerTeam.costCapSpent)} against the ${formatCurrency(state.regulations.costCapUsd)} limit.`,
      read: false,
    });
  }

  // Add fresh AI transfer rumor
  const randomRival = teams[(nextWeek + 1) % teams.length];
  const randomDrv = drivers[(nextWeek * 2) % drivers.length];
  transferRumors.unshift({
    id: `rum_${nextWeek}`,
    week: nextWeek,
    textTr: `Hafta ${nextWeek} Padok Raporu: ${randomRival.name}, gelecek sezon yapılanması kapsamında ${randomDrv.name} ve yeni bir ön kanat paketi üzerinde çalışıyor.`,
    textEn: `Week ${nextWeek} Paddock Report: ${randomRival.name} is evaluating ${randomDrv.name} and testing a revised aero package.`,
  });

  return {
    ...state,
    currentWeek: nextWeek,
    teams,
    drivers,
    staff,
    inbox: inbox.slice(0, 40),
    ledger: ledger.slice(0, 80),
    transferRumors: transferRumors.slice(0, 15),
  };
}
