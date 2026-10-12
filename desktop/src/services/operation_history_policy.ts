export type OperationEntry = {
  operation_id: string;
  journal_unverified?: boolean;
  recovery_required?: boolean;
  retained_targets_count?: number;
  acknowledgement?: { acknowledged?: boolean };
  lifecycle?: { status?: string; apps?: { bundle_id: string; quit_requested?: boolean; reopened?: boolean }[] };
  host?: { status?: string; error?: string };
  native?: { status?: string; targets?: { path: string; status: string }[] };
};
// Native determines recovery; acknowledgement only affects notifications.
export function historyEntries(rows: OperationEntry[], mode: 'banner' | 'history') {
  return mode === 'history' ? rows : rows.filter(row => row.recovery_required && !row.acknowledgement?.acknowledged);
}
