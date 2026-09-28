import { ModalRoute } from '@/chrome/overlays';
import { RecipeEditorScreen } from '@/screens/recipe-editor';
import { RequireSession } from '@/session/guard';

export default function NewRecipeRoute() {
  return (
    <RequireSession>
      <ModalRoute>
        <RecipeEditorScreen mode="new" />
      </ModalRoute>
    </RequireSession>
  );
}
