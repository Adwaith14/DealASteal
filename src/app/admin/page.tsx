import { AdminDealsPanel } from '@/components/admin/AdminDealsPanel';
import { AdminNetworkPanel, type IngestNetworkSettingRow } from '@/components/admin/AdminNetworkPanel';
import { dealSelectColumnsForPostgrest } from '@/lib/catalog/deals-db-schema';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import type { Deal } from '@/types/database.types';

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();
  const cols = dealSelectColumnsForPostgrest();

  const [dealsRes, netRes, settingsRes] = await Promise.all([
    supabase.from('deals').select(cols).order('created_at', { ascending: false }).limit(40),
    supabase
      .from('ingest_network_status')
      .select('network, last_started_at, last_finished_at, last_ok, last_error, last_rows, updated_at')
      .order('network', { ascending: true }),
    supabase
      .from('ingest_network_settings')
      .select('network_slug, ingest_enabled, tos_url, disclosure_note, attribution_note, updated_at')
      .order('network_slug', { ascending: true }),
  ]);

  const deals = (dealsRes.data ?? []) as unknown as Deal[];
  const networks = netRes.data ?? [];
  const networkSettings = (settingsRes.error ? [] : (settingsRes.data ?? [])) as unknown as IngestNetworkSettingRow[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Operator console</h1>
      <p className="mt-1 text-sm text-gray-600">Pin deals, hide bad listings, edit categories. Changes are audited.</p>
      {settingsRes.error ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Network ingest settings unavailable ({settingsRes.error.message}). Apply migration{' '}
          <code className="font-mono">20260502120000_phase24_multi_network.sql</code>.
        </p>
      ) : null}
      <div className="mt-8 space-y-10">
        <AdminNetworkPanel settings={networkSettings} />
        <AdminDealsPanel deals={deals} networks={networks} />
      </div>
    </div>
  );
}
