# iOS Style Recipe

这是一个使用 pnpm 管理的 monorepo。

## 目录结构

```text
apps/
└── web/       # Next.js Web 应用
packages/      # 未来可复用的跨项目包
```

## 开发命令

在仓库根目录执行：

```bash
pnpm install

# 默认启动 Web
pnpm dev

# 按子项目启动 Web
pnpm dev:web

# Web 的其他命令
pnpm build:web
pnpm start:web
pnpm lint:web
pnpm typecheck:web
```

根目录的 `dev`、`build`、`start`、`lint` 和 `typecheck` 默认指向 `apps/web`，方便只有一个应用时直接使用。每个子项目也保留自己的 package scripts，因此新增 Expo 项目后，可以在 `apps/mobile/package.json` 中定义 `dev`，再从根目录通过 `pnpm --filter <package-name> dev` 或对应的根脚本启动。

## 新增子项目

将项目放到 `apps/<name>` 下，并确保它有独立的 `package.json`。pnpm 会自动将其纳入 workspace：

```bash
pnpm --filter <package-name> dev
pnpm --filter <package-name> build
```

如果希望使用更易记的根命令，在根 `package.json` 增加同样模式的别名，例如：

```json
{
  "scripts": {
    "dev:mobile": "pnpm --filter @recipe/mobile dev"
  }
}
```
