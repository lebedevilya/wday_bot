import Wall from '@/components/Wall';
import { gameVisible } from '@/lib/gate';
import ComingSoon from '@/components/ComingSoon';

export const dynamic = 'force-dynamic';

export default async function WallPage() {
  if (!(await gameVisible())) return <ComingSoon />;
  return <Wall />;
}
