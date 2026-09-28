import { ModalRoute } from '@/chrome/overlays';
import { TaxonomyScreen } from '@/screens/taxonomy';
import { RequireSession } from '@/session/guard';

export default function CategoriesRoute() {
  return (
    <RequireSession>
      <ModalRoute>
        <TaxonomyScreen kind="category" />
      </ModalRoute>
    </RequireSession>
  );
}
