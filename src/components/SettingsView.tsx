import { useState } from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import { AgencySettings, CurrencyCode } from '../types/immo';

interface SettingsViewProps {
  settings: AgencySettings;
  onSaveSettings: (updated: AgencySettings) => void;
  onRequestClearAllData: () => void;
  onRestoreInitialData: () => void;
}

export function SettingsView({
  settings,
  onSaveSettings,
  onRequestClearAllData,
  onRestoreInitialData,
}: SettingsViewProps) {
  const [form, setForm] = useState<AgencySettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight">
          Paramètres de l’agence
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configuration générale, barème d’honoraires et préférences de diffusion
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100"
      >
        {/* Identity */}
        <div className="p-6 space-y-4">
          <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">
            Identité juridique &amp; siège
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Raison sociale
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Adresse du siège
              </label>
              <input
                type="text"
                value={form.headquarters}
                onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail direction
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>
          </div>
        </div>

        {/* Financial Preferences */}
        <div className="p-6 space-y-4">
          <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">
            Paramètres financiers &amp; rapports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Taux d’honoraires (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="15"
                value={form.defaultCommissionRate}
                onChange={(e) =>
                  setForm({ ...form, defaultCommissionRate: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Devise d’affichage
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value as CurrencyCode })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="MAD">Dirham marocain (MAD)</option>
                <option value="EUR">Euro (€)</option>
                <option value="CHF">Franc suisse (CHF)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fréquence des rapports
              </label>
              <select
                value={form.autoReportFrequency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    autoReportFrequency: e.target.value as AgencySettings['autoReportFrequency'],
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Mensuel">Mensuel</option>
                <option value="Trimestriel">Trimestriel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 space-y-3">
          <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">
            Alertes commerciales
          </h3>
          <label className="flex items-center justify-between py-1.5 cursor-pointer">
            <span className="text-sm text-slate-700">
              Notifier lors d’une nouvelle offre d’achat reçue
            </span>
            <input
              type="checkbox"
              checked={form.notifyNewOffer}
              onChange={(e) => setForm({ ...form, notifyNewOffer: e.target.checked })}
              className="h-4 w-4 accent-[#0B1F3A] rounded"
            />
          </label>
          <label className="flex items-center justify-between py-1.5 cursor-pointer">
            <span className="text-sm text-slate-700">
              Notifier lors de la signature définitive d’un acte
            </span>
            <input
              type="checkbox"
              checked={form.notifySignedSale}
              onChange={(e) => setForm({ ...form, notifySignedSale: e.target.checked })}
              className="h-4 w-4 accent-[#0B1F3A] rounded"
            />
          </label>
          <label className="flex items-center justify-between py-1.5 cursor-pointer">
            <span className="text-sm text-slate-700">
              Envoyer la synthèse hebdomadaire à la direction
            </span>
            <input
              type="checkbox"
              checked={form.notifyWeeklyDigest}
              onChange={(e) => setForm({ ...form, notifyWeeklyDigest: e.target.checked })}
              className="h-4 w-4 accent-[#0B1F3A] rounded"
            />
          </label>
        </div>

        {/* Footer Submit */}
        <div className="px-6 py-4 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            {savedNotice && (
              <>
                <Check className="h-4 w-4" />
                <span>Paramètres enregistrés avec succès.</span>
              </>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132F54] transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {/* Data Management Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">
            Gestion des données
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Supprimer l’ensemble des biens, ventes, clients et agents, ou restaurer le jeu de données initial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onRequestClearAllData}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Supprimer toutes les données</span>
          </button>

          <button
            type="button"
            onClick={onRestoreInitialData}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#0B1F3A] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#C9A24D]" />
            <span>Restaurer les données initiales</span>
          </button>
        </div>
      </div>
    </div>
  );
}
