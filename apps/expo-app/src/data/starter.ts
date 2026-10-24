/**
 * 新账号的起步内容：6 道入门菜谱 + 默认分类 / 标签。
 * 打卡次数与「上次做于」从 0 开始，不预置任何假数据。
 * 封面用 App 内置的种子插画（seed: 前缀），用户换封面后变成 Storage 路径。
 */
export type StarterRecipe = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  minutes: number;
  servings: number;
  image: string;
  favorite: boolean;
  cooked: number;
  tags: string[];
  ingredients: { group: string; items: { name: string; amount: string }[] }[];
  steps: string[];
};

export const STARTER_RECIPES: StarterRecipe[] = [
  {
    slug: 'tomato-brisket-rice',
    title: '番茄牛腩饭',
    subtitle: '炖到第七次开盖时，汤刚好挂在饭上',
    category: '主食',
    minutes: 90,
    servings: 2,
    image: 'seed:braised-beef',
    favorite: true,
    cooked: 0,
    tags: ['一锅出', '可隔夜', '高蛋白'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '牛腩', amount: '400 g' },
          { name: '番茄', amount: '3 个（约 450 g）' },
          { name: '米饭', amount: '2 碗' },
        ],
      },
      {
        group: '调味',
        items: [
          { name: '姜片', amount: '4 片' },
          { name: '番茄膏', amount: '1 汤匙' },
          { name: '生抽', amount: '2 汤匙' },
          { name: '冰糖', amount: '6 g' },
        ],
      },
    ],
    steps: [
      '牛腩切 3 cm 方块，冷水下锅，沸腾后撇净浮沫，捞出用温水冲净。',
      '两个番茄切块直接下锅炒到起沙，另一个擦成泥，保留汁水。',
      '牛腩回锅与番茄同炒，加番茄膏炒出红油，倒入没过食材的热水。',
      '小火炖 60 分钟，加生抽与冰糖，再炖 20 分钟至能用筷子轻松穿透。',
      '开盖收汁到浓稠能挂勺，浇在热米饭上，撒一点葱花。',
    ],
  },
  {
    slug: 'seared-salmon-asparagus',
    title: '香煎三文鱼配芦笋',
    subtitle: '皮要脆，只需要一口够热的锅',
    category: '轻食',
    minutes: 25,
    servings: 2,
    image: 'seed:salmon',
    favorite: true,
    cooked: 0,
    tags: ['低碳水', '15 分钟', 'omega-3'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '三文鱼排', amount: '2 块（约 300 g）' },
          { name: '芦笋', amount: '12 根' },
          { name: '柠檬', amount: '半个' },
        ],
      },
      {
        group: '调味',
        items: [
          { name: '海盐', amount: '2 g' },
          { name: '黑胡椒', amount: '现磨' },
          { name: '橄榄油', amount: '1 汤匙' },
          { name: '黄油', amount: '10 g' },
        ],
      },
    ],
    steps: [
      '鱼排室温回温 15 分钟，厨房纸吸干表面水分，两面撒盐。',
      '芦笋去老根，淋油与盐，备用。',
      '锅烧到冒微烟，皮面朝下入锅，压 30 秒不翻动，煎 4 分钟。',
      '翻面加黄油、蒜瓣，用勺子把热油反复淋在鱼身上，2 分钟。',
      '出锅前芦笋下锅快炒 90 秒，挤柠檬汁，静置 3 分钟再切。',
    ],
  },
  {
    slug: 'sesame-spinach',
    title: '麻油拌菠菜',
    subtitle: '烫 40 秒就捞，颜色才留在春天那一侧',
    category: '轻食',
    minutes: 10,
    servings: 2,
    image: 'seed:spinach',
    favorite: false,
    cooked: 0,
    tags: ['快手', '素食', '铁'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '菠菜', amount: '300 g' },
          { name: '白芝麻', amount: '1 茶匙' },
        ],
      },
      {
        group: '调味',
        items: [
          { name: '麻油', amount: '1 茶匙' },
          { name: '生抽', amount: '1 茶匙' },
          { name: '糖', amount: '2 g' },
        ],
      },
    ],
    steps: [
      '水大开后加一小勺盐，菠菜整把下锅，40 秒立刻捞出。',
      '过冰水并挤干水分，切成 4 cm 的段。',
      '麻油、生抽、糖调匀，拌入菠菜，撒芝麻即可。',
    ],
  },
  {
    slug: 'miso-mushroom-pasta',
    title: '味噌奶油蘑菇意面',
    subtitle: '一勺白味噌，替整道菜把鲜味收住',
    category: '主食',
    minutes: 30,
    servings: 2,
    image: 'seed:pasta',
    favorite: false,
    cooked: 0,
    tags: ['一锅出', '素食可'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '意面', amount: '180 g' },
          { name: '口蘑', amount: '200 g' },
          { name: '淡奶油', amount: '120 ml' },
        ],
      },
      {
        group: '调味',
        items: [
          { name: '白味噌', amount: '1 汤匙' },
          { name: '蒜', amount: '2 瓣' },
          { name: '黑胡椒', amount: '现磨' },
        ],
      },
    ],
    steps: [
      '意面按包装时间少煮 1 分钟，留半杯面汤。',
      '蘑菇切片，中火干煸到出水再上色，盛出。',
      '蒜片小火煸香，加淡奶油与味噌化开，倒入面汤乳化。',
      '意面与蘑菇回锅，颠锅至酱汁紧紧裹住面条，磨黑胡椒。',
    ],
  },
  {
    slug: 'steamed-egg-custard',
    title: '虾皮蒸蛋',
    subtitle: '蛋液过筛两次，表面才像一面小镜子',
    category: '汤羹',
    minutes: 15,
    servings: 2,
    image: 'seed:egg',
    favorite: false,
    cooked: 0,
    tags: ['软食', '快手', '儿童友好'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '鸡蛋', amount: '3 个' },
          { name: '温水', amount: '300 ml（蛋液的 1.5 倍）' },
          { name: '虾皮', amount: '1 小把' },
        ],
      },
      {
        group: '调味',
        items: [
          { name: '盐', amount: '2 g' },
          { name: '香油', amount: '几滴' },
          { name: '生抽', amount: '½ 茶匙' },
        ],
      },
    ],
    steps: [
      '蛋液打散，加盐与 1.5 倍温水，过筛两次去泡。',
      '覆保鲜膜扎几个小孔，水开后中小火蒸 10 分钟。',
      '开盖撒虾皮，再蒸 1 分钟，淋香油与生抽。',
    ],
  },
  {
    slug: 'berry-yogurt-bowl',
    title: '莓果酸奶碗',
    subtitle: '早餐前十分钟，也算认真吃过',
    category: '甜点',
    minutes: 5,
    servings: 1,
    image: 'seed:yogurt',
    favorite: true,
    cooked: 0,
    tags: ['免煮', '早餐', '高钙'],
    ingredients: [
      {
        group: '主料',
        items: [
          { name: '无糖酸奶', amount: '200 g' },
          { name: '混合莓果', amount: '80 g' },
          { name: '燕麦片', amount: '2 汤匙' },
        ],
      },
      {
        group: '调味',
        items: [{ name: '蜂蜜', amount: '1 茶匙' }],
      },
    ],
    steps: [
      '酸奶提前冷藏，倒入碗中抹平。',
      '莓果洗净沥干，沿一侧依次排开。',
      '撒燕麦与蜂蜜，立即食用口感最好。',
    ],
  },
];

export const DEFAULT_CATEGORIES = ['主食', '轻食', '汤羹', '甜点'];

export const DEFAULT_TAGS = ['快手', '一锅出', '素食', '高蛋白', '可隔夜', '儿童友好'];
