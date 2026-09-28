import { RecipeDetailScreen } from '@/screens/recipe-detail';
import { RequireSession } from '@/session/guard';

export default function RecipeDetailRoute() {
  return (
    <RequireSession>
      <RecipeDetailScreen />
    </RequireSession>
  );
}
