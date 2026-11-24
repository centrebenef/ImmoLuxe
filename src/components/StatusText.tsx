import { CheckCircle2, Clock, FileSignature, XCircle } from 'lucide-react';
import { PropertyStatus, TransactionStatus } from '../types/immo';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
}

export function TransactionStatusText({ status }: TransactionStatusBadgeProps) {
  const config: Record<
    TransactionStatus,
    { colorClass: string; Icon: typeof CheckCircle2 }
  > = {
    Signée: { colorClass: 'text-emerald-700', Icon: CheckCircle2 },
    'Sous compromis': { colorClass: 'text-[#9A7524]', Icon: FileSignature },
    'En attente': { colorClass: 'text-amber-700', Icon: Clock },
    Annulée: { colorClass: 'text-red-700', Icon: XCircle },
  };

  const { colorClass, Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${colorClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>{status}</span>
    </span>
  );
}

interface PropertyStatusTextProps {
  status: PropertyStatus;
}

export function PropertyStatusText({ status }: PropertyStatusTextProps) {
  const config: Record<
    PropertyStatus,
    { colorClass: string; Icon: typeof CheckCircle2 }
  > = {
    Disponible: { colorClass: 'text-emerald-700', Icon: CheckCircle2 },
    'Sous offre': { colorClass: 'text-[#9A7524]', Icon: Clock },
    Vendu: { colorClass: 'text-slate-600', Icon: FileSignature },
  };

  const { colorClass, Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${colorClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>{status}</span>
    </span>
  );
}
