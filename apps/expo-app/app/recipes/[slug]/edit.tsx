import { ModalRoute } from '@/chrome/overlays';
import { RecipeEditorScreen } from '@/screens/recipe-editor';
import { RequireSession } from '@/session/guard';

export default function EditRecipeRoute() {
  return (
    <RequireSession>
      <ModalRoute>
        <RecipeEditorScreen mode="edit" />
      </ModalRoute>
    </RequireSession>
  );
}
