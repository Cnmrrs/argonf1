import React, { useState } from 'react';
import {
  ContractTerms,
  DriverEntity,
  DriverRole,
  StaffEntity,
  TeamEntity,
} from '../core/types';
import {
  evaluateContractOffer,
  NegotiationEvaluation,
} from '../simulation/simulationEngine';
import { formatCurrency } from '../core/i18n';
import { soundEngine } from '../audio/soundEngine';

interface NegotiationModalProps {
  target: DriverEntity | StaffEntity;
  isDriver: boolean;
  playerTeam: TeamEntity;
  allTeams: TeamEntity[];
  seasonYear: number;
  onAcceptContract: (targetId: string, isDriver: boolean, finalTerms: ContractTerms, buyoutPaid: number) => void;
  onClose: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  target,
  isDriver,
  playerTeam,
  allTeams,
  seasonYear,
  onAcceptContract,
  onClose,
}) => {
  const isAlreadyOurs = target.teamId === playerTeam.id;
  const currentTeam = allTeams.find((t) => t.id === target.teamId);
  const buyoutCost = !isAlreadyOurs && target.teamId ? target.contract.terminationClause : 0;

  const [terms, setTerms] = useState<ContractTerms>({
    ...target.contract,
    annualSalary: Math.round(target.contract.annualSalary * 1.05),
    durationYears: target.contract.durationYears || 2,
    expirationSeason: seasonYear + (target.contract.durationYears || 2),
    guaranteedRole: isDriver ? (target as DriverEntity).role : undefined,
  });

  const [selectedTone, setSelectedTone] = useState<'ambitious' | 'financial' | 'loyal' | 'pressure' | 'neutral'>('ambitious');
  const [freeTextMessage, setFreeTextMessage] = useState<string>('');
  const [evaluation, setEvaluation] = useState<NegotiationEvaluation | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ speaker: string; text: string }>>([
    {
      speaker: `${target.name} & Menajeri`,
      text: isAlreadyOurs
        ? `"${playerTeam.name} ile sözleşme yenileme görüşmesi için buradayız. Gelecek sezon hedeflerinizi ve teklifinizi dinliyoruz."`
        : `"${playerTeam.name} projesini yakından takip ediyoruz. Bize nasıl bir sportif rol ve mali paket sunuyorsunuz?"`,
    },
  ]);

  const handleSubmitOffer = () => {
    soundEngine.playClick();
    const res = evaluateContractOffer({
      target,
      isDriver,
      offeredTerms: {
        ...terms,
        expirationSeason: seasonYear + terms.durationYears,
      },
      playerTeam,
      allTeams,
      freeTextMessage,
      selectedDialogueTone: selectedTone,
    });
    setEvaluation(res);

    const playerStatement =
      freeTextMessage.trim().length > 0
        ? freeTextMessage.trim()
        : `Yıllık ${formatCurrency(terms.annualSalary)} maaş, ${terms.durationYears} yıllık kontrat ve ${formatCurrency(terms.signingBonus)} imza primi öneriyoruz.`;

    setDialogueHistory((prev) => [
      ...prev,
      { speaker: `${playerTeam.principalName} (Siz)`, text: `"${playerStatement}"` },
      { speaker: `${target.name} Temsilcisi`, text: res.messageTr },
    ]);
    setFreeTextMessage('');
  };

  const handleAcceptCounter = () => {
    if (!evaluation?.counterTerms) return;
    soundEngine.playClick();
    onAcceptContract(target.id, isDriver, evaluation.counterTerms, buyoutCost);
  };

  const handleFinalizeAccepted = () => {
    soundEngine.playClick();
    onAcceptContract(target.id, isDriver, terms, buyoutCost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-rose-400">
              RESMİ SÖZLEŞME MÜZAKERE ODASI · {isDriver ? 'PİLOT TRANSFER & KONTRAT' : 'DEPARTMAN PERSONELİ'}
            </span>
            <h2 className="text-xl font-bold text-white font-display mt-0.5">
              {target.name} — {isDriver ? `${(target as DriverEntity).nationality} · #${(target as DriverEntity).number}` : (target as StaffEntity).role}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md"
          >
            Masadan Kalk
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Contract Financial & Sporting Terms */}
          <div className="lg:col-span-6 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span>Mevcut Takım: <strong className="text-white">{currentTeam ? currentTeam.name : 'Serbest (Free Agent)'}</strong></span>
              <span>Mevcut Maaş: <strong className="text-emerald-400 font-mono">{formatCurrency(target.contract.annualSalary)}</strong></span>
            </div>

            {buyoutCost > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                Sözleşme Fesih (Buyout) Bedeli: <strong className="font-mono">{formatCurrency(buyoutCost)}</strong> (İmza anında mevcut kulübüne ödenir)
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Yıllık Maaş Teklifi ($)</label>
                <input
                  type="number"
                  step={250000}
                  min={250000}
                  value={terms.annualSalary}
                  onChange={(e) => setTerms({ ...terms, annualSalary: Math.max(250000, Number(e.target.value)) })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                />
                <span className="text-[11px] text-slate-400 font-mono">{formatCurrency(terms.annualSalary)} / yıl</span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sözleşme Süresi (Yıl)</label>
                <select
                  value={terms.durationYears}
                  onChange={(e) => setTerms({ ...terms, durationYears: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                >
                  <option value={1}>1 Sezon ({seasonYear + 1})</option>
                  <option value={2}>2 Sezon ({seasonYear + 2})</option>
                  <option value={3}>3 Sezon ({seasonYear + 3})</option>
                  <option value={4}>4 Sezon ({seasonYear + 4})</option>
                  <option value={5}>5 Sezon ({seasonYear + 5})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">İmza Primi ($)</label>
                <input
                  type="number"
                  step={100000}
                  min={0}
                  value={terms.signingBonus}
                  onChange={(e) => setTerms({ ...terms, signingBonus: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Şampiyonluk Primi ($)</label>
                <input
                  type="number"
                  step={250000}
                  min={0}
                  value={terms.championshipBonus}
                  onChange={(e) => setTerms({ ...terms, championshipBonus: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>

              {isDriver ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Garanti Edilen Takım İçi Rol</label>
                    <select
                      value={terms.guaranteedRole || 'equal'}
                      onChange={(e) => setTerms({ ...terms, guaranteedRole: e.target.value as DriverRole })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                    >
                      <option value="lead">1 Numaralı Lider Pilot</option>
                      <option value="equal">Eşit Statü (Serbest Rekabet)</option>
                      <option value="second">2. Pilot (Destek Rolü)</option>
                      <option value="reserve">Yedek & Simülatör Pilotu</option>
                      <option value="academy">Genç Akademi Pilotu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Takım Emirleri Beklentisi</label>
                    <select
                      value={terms.teamOrdersClause || 'equal'}
                      onChange={(e) =>
                        setTerms({ ...terms, teamOrdersClause: e.target.value as ContractTerms['teamOrdersClause'] })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                    >
                      <option value="priority">Öncelikli Geçiş Hakkı</option>
                      <option value="equal">Duruma Göre Eşit</option>
                      <option value="obey">Takım Emirlerine Tam Uyum</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gardening Leave (Zorunlu İzin)</label>
                    <select
                      value={terms.gardeningLeaveMonths}
                      onChange={(e) => setTerms({ ...terms, gardeningLeaveMonths: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                    >
                      <option value={0}>Yok (0 Ay)</option>
                      <option value={3}>3 Ay Rekabet Yasağı</option>
                      <option value={6}>6 Ay Gardening Leave</option>
                      <option value={12}>12 Ay Tam Gizlilik Koruması</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Yıllık Maaş Artışı (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={terms.annualRaisePercent}
                      onChange={(e) => setTerms({ ...terms, annualRaisePercent: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Strategic Dialogue Tone Choices */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Stratejik Müzakere Yaklaşımı Seçin</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['ambitious', 'Şampiyonluk & Rüzgar Tüneli Vizyonu Vurgula'],
                    ['financial', 'Mali Güvence ve Prim Paketini Öne Çıkar'],
                    ['loyal', 'Uzun Vadeli Aile ve Liderlik Kültürünü Vurgula'],
                    ['pressure', 'Sert Pazarlık: "Bu Son Teklifimiz"'],
                  ] as const
                ).map(([tone, label]) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`p-2 text-left text-xs rounded border transition-colors ${
                      selectedTone === tone
                        ? 'bg-rose-600/20 border-rose-500 text-white font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Free-form Text Negotiation Input */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Serbest Metin Diyaloğu (İsteğe bağlı özel vaat veya mesaj yazın)
              </label>
              <input
                type="text"
                value={freeTextMessage}
                onChange={(e) => setFreeTextMessage(e.target.value)}
                placeholder="Örn: Seni 1 numaralı şampiyonluk liderimiz yapacağız, yeni rüzgar tüneli yolda..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white"
              />
            </div>

            <button
              onClick={handleSubmitOffer}
              className="w-full py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
            >
              Teklifi ve Mesajı Masaya Sun
            </button>
          </div>

          {/* Right: Live Dialogue Transcript & Decision Actions */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between bg-slate-950/60">
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              <div className="text-xs font-semibold text-slate-400">Canlı Müzakere Diyalog Kaydı</div>
              {dialogueHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs border ${
                    item.speaker.includes('(Siz)')
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-100 ml-6'
                      : 'bg-slate-900 border-slate-800 text-slate-200 mr-6'
                  }`}
                >
                  <div className="font-bold text-[11px] text-slate-400 mb-1">{item.speaker}</div>
                  <div>{item.text}</div>
                </div>
              ))}
            </div>

            {evaluation && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Temsilci Memnuniyet Endeksi:</span>
                  <span className="font-mono font-bold text-white">{evaluation.happinessScore}/100</span>
                </div>

                {evaluation.status === 'accepted' && (
                  <button
                    onClick={handleFinalizeAccepted}
                    className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  >
                    Resmi Sözleşmeyi İmzala ({formatCurrency(terms.annualSalary)}/yıl)
                  </button>
                )}

                {evaluation.status === 'counteroffer' && evaluation.counterTerms && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAcceptCounter}
                      className="flex-1 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                    >
                      Karşı Teklifi Kabul Et ve İmzala ({formatCurrency(evaluation.counterTerms.annualSalary)}/yıl)
                    </button>
                    <button
                      onClick={() => setTerms(evaluation.counterTerms!)}
                      className="px-3 py-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                    >
                      Şartları Forma Aktar
                    </button>
                  </div>
                )}

                {evaluation.status === 'rejected' && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    Teklif reddedildi. Maaş paketini, imza primini veya takım içi rol garantisini iyileştirip tekrar teklif sunabilirsiniz.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
