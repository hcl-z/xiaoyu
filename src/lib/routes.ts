export type Route =
  | "welcome"
  | "login"
  | "register"
  | "today"
  | "recipes"
  | "recipe"
  | "newRecipe"
  | "editRecipe"
  | "checkin"
  | "profile"
  | "categories"
  | "tags";

export type RouteKind = "启动" | "Tab" | "Push" | "Modal";

export type RouteMeta = {
  id: Route;
  path: string;
  demoPath: string;
  name: string;
  purpose: string;
  kind: RouteKind;
  transition: string;
  tab?: string;
  /** data source of the route */
  data: string;
  /** design-system components the screen is composed from */
  uses: string[];
};

export const ROUTES: RouteMeta[] = [
  {
    id: "welcome",
    path: "/welcome",
    demoPath: "/welcome",
    name: "欢迎",
    purpose: "首次启动：一句话主张 + 矢量碗插画；「开始使用」注册、「我已有账号」登录、「先逛逛」进入演示账号。全程不使用摄影图片。",
    kind: "启动",
    transition: "淡入 · 无返回",
    data: "—",
    uses: ["PhoneFrame", "Button", "Metric", "Micro", "grain"],
  },
  {
    id: "register",
    path: "/register",
    demoPath: "/register?preview=1",
    name: "注册",
    purpose: "昵称 / 邮箱 / 密码三项；密码规则实时勾选，满足后才可提交；注册即获得 6 道入门菜谱。",
    kind: "启动",
    transition: "欢迎页推入 · 成功后整页进入",
    data: "POST /api/auth/register",
    uses: ["NavBar", "Section", "CheckCircle", "Button", "Caption"],
  },
  {
    id: "login",
    path: "/login",
    demoPath: "/login?preview=1",
    name: "登录",
    purpose: "点击「登录」直接进入演示主页，不要求填写或校验账号；私人账号登录作为可选入口，登录后回到原本要去的页面。",
    kind: "启动",
    transition: "欢迎页推入 · 成功后整页进入",
    data: "POST /api/auth/login",
    uses: ["NavBar", "Section", "Display", "Button", "Caption"],
  },
  {
    id: "today",
    path: "/today",
    demoPath: "/today",
    name: "今日",
    purpose: "周历条与日期选择器可浏览任意过去日期；历史记录可查看、补记与修改，未来日期禁用。",
    kind: "Tab",
    transition: "Tab 淡入切换",
    tab: "today",
    data: "GET /api/checkins",
    uses: ["Ring", "Sparkbars", "ListGroup", "ListRow", "CheckCircle", "Stepper", "Badge"],
  },
  {
    id: "recipes",
    path: "/recipes",
    demoPath: "/recipes",
    name: "菜谱库",
    purpose: "实时搜索、分段筛选、分类 chips；特写大卡 + 紧凑列表行。",
    kind: "Tab",
    transition: "Tab 淡入切换",
    tab: "recipes",
    data: "GET /api/recipes",
    uses: ["SearchField", "Segmented", "Pill", "Card", "ListRow", "Skeleton", "EmptyState"],
  },
  {
    id: "recipe",
    path: "/recipes/[slug]",
    demoPath: "/recipes/tomato-brisket-rice",
    name: "菜谱详情",
    purpose:
      "图片头叠内容；食材 / 步骤 / 记录三标签。食材可按人份换算并逐条勾选，记录页聚合这道菜的每一次打卡与历次笔记。",
    kind: "Push",
    transition: "横向推入 · 可侧滑返回",
    data: "GET /api/recipes、GET /api/recipes/[slug]/history",
    uses: ["NavBar", "Segmented", "CheckCircle", "Stepper", "ListGroup", "Badge", "Button"],
  },
  {
    id: "newRecipe",
    path: "/recipes/new",
    demoPath: "/recipes/new",
    name: "新建菜谱",
    purpose:
      "原生 Inset Grouped 表单；应用内以全屏弹窗打开，顶部左叉号取消、右对勾完成，名称为空时完成置灰。路径仍可直接访问。",
    kind: "Modal",
    transition: "弹簧上推 · 单一完成动作",
    data: "POST /api/recipes",
    uses: ["FullScreenModal", "RecipeEditor", "ListGroup", "TextInput", "Segmented", "Stepper"],
  },
  {
    id: "editRecipe",
    path: "/recipes/[slug]/edit",
    demoPath: "/recipes/tomato-brisket-rice/edit",
    name: "编辑菜谱",
    purpose:
      "与新增共用 RecipeEditor；带回全部字段，可保存修改或二次确认删除。应用内以全屏弹窗打开，取消后原地回到详情。",
    kind: "Modal",
    transition: "详情页编辑 → 弹簧上推 → 完成原地落回",
    data: "PATCH /api/recipes",
    uses: ["FullScreenModal", "RecipeEditor", "ListGroup", "TextInput", "Segmented", "Button"],
  },
  {
    id: "checkin",
    path: "/checkin",
    demoPath: "/today?checkin=1&meal=%E6%99%9A%E9%A4%90&recipe=berry-yogurt-bowl",
    name: "打卡弹层",
    purpose:
      "右下角悬浮按钮随处唤起，就地上推、不离开当前页；可选菜谱或手动输入，并写下这次的笔记。所选日期在未来时自动切为「安排计划」。",
    kind: "Modal",
    transition: "FAB 唤起 · 弹簧上推 · 关闭原地落回",
    data: "POST / PATCH / DELETE /api/checkins",
    uses: ["Sheet", "Segmented", "TextArea", "SuccessOverlay", "Button", "Badge"],
  },
  {
    id: "profile",
    path: "/profile",
    demoPath: "/profile",
    name: "我的",
    purpose:
      "连续打卡热力图、累计统计、分类与标签管理、关于与账号；退出登录走 Alert 确认。",
    kind: "Tab",
    transition: "Tab 淡入切换",
    tab: "profile",
    data: "GET /api/stats、GET /api/taxonomies",
    uses: ["Heatmap", "Card", "Stat", "ListGroup", "ListRow", "Alert", "Micro"],
  },
  {
    id: "categories",
    path: "/profile/categories",
    demoPath: "/profile/categories",
    name: "分类管理",
    purpose:
      "增删改菜谱分类，实时显示每个分类被多少道菜谱使用；改名同步所有菜谱，占用中的分类禁止删除。应用内以全屏弹窗打开，右上加号直接新增。",
    kind: "Modal",
    transition: "弹簧上推 · 关闭回「我的」",
    data: "GET/POST/PATCH/DELETE /api/taxonomies",
    uses: ["FullScreenModal", "Section", "ListRow", "Sheet", "Alert", "TextInput"],
  },
  {
    id: "tags",
    path: "/profile/tags",
    demoPath: "/profile/tags",
    name: "标签管理",
    purpose:
      "增删改菜谱标签；改名同步所有菜谱，删除时从菜谱上摘除标签但保留菜谱本身。应用内以全屏弹窗打开，编辑弹层叠在其上。",
    kind: "Modal",
    transition: "弹簧上推 · 关闭回「我的」",
    data: "GET/POST/PATCH/DELETE /api/taxonomies",
    uses: ["FullScreenModal", "Section", "ListRow", "Sheet", "Alert", "EmptyState"],
  },
];

export const KIND_COLOR: Record<RouteKind, string> = {
  启动: "#636366",
  Tab: "#34C759",
  Push: "#007AFF",
  Modal: "#0062CC",
};

export const TAB_ROUTES = ROUTES.filter((r) => r.kind === "Tab");

export function routeById(id: Route): RouteMeta {
  return ROUTES.find((r) => r.id === id)!;
}
