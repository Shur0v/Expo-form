/** The source service record shape, isolated from the original dashboard. */
export interface ServiceRecord {
  id: string;
  module: string;
  companyId?: string;
  participationId?: string;
  editionId?: string;
  ownerId?: string;
  title: string;
  status: string;
  fields: Record<string, string>;
  at: string;
}

export interface OfferCompany { id: string; name: string; contactName?: string; email?: string }
export interface OfferEdition { id: string; series: string; year: number; name: string; currency: string }
