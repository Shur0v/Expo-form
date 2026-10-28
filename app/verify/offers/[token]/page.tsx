import { OfferletterVerification } from '@/components/offerletter/verification';

export default async function VerifyOffer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OfferletterVerification token={token} />;
}
