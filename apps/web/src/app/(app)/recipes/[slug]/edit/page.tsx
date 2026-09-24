"use client";

import { useParams, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button, EmptyState, NavBar, Section, Skeleton } from "@/components/ds";
import { RecipeEditor } from "@/components/app/RecipeEditor";
import { useRecipes } from "@/lib/use-app-data";

export default function EditRecipePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { recipes, loading } = useRecipes();
  const recipe = recipes.find((item) => item.slug === params.slug);

  if (loading && !recipe) {
    return (
      <div>
        <NavBar variant="compact" title="编辑菜谱" backLabel="" />
        <div className="flex flex-col gap-5 px-5 pt-5">
          <Skeleton className="h-24 w-full" rounded="rounded-group" />
          <Skeleton className="h-40 w-full" rounded="rounded-group" />
          <Skeleton className="h-32 w-full" rounded="rounded-group" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div>
        <NavBar
          variant="compact"
          title="编辑菜谱"
          onBack={() => router.replace("/recipes")}
          backLabel="菜谱"
        />
        <div className="px-5 py-10">
          <Section>
            <EmptyState
              icon={<BookOpen size={26} strokeWidth={1.6} />}
              title="找不到这道菜谱"
              description="它可能已经被删除。"
              action={
                <Button size="sm" onClick={() => router.replace("/recipes")}>
                  返回菜谱库
                </Button>
              }
            />
          </Section>
        </div>
      </div>
    );
  }

  return <RecipeEditor mode="edit" recipe={recipe} />;
}
