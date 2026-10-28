import type { OfferCompany, OfferEdition, ServiceRecord } from '@/lib/offerletter/types';

export interface ViewProps {
  state: {
    records: ServiceRecord[];
    companies: OfferCompany[];
    editions: OfferEdition[];
    accounts: { id: string; name: string; role: string; email?: string; companyId?: string }[];
  };
  context: { accountId: string };
  run: (command: { type: 'record'; record: ServiceRecord }) => Promise<boolean>;
  readOnly: boolean;
}
