import { ModalRoute } from '@/chrome/overlays';
import { TaxonomyScreen } from '@/screens/taxonomy';
import { RequireSession } from '@/session/guard';

export default function TagsRoute() {
  return (
    <RequireSession>
      <ModalRoute>
        <TaxonomyScreen kind="tag" />
      </ModalRoute>
    </RequireSession>
  );
}
