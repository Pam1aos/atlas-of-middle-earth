export type EntityType =
  | 'character' | 'race' | 'place' | 'realm' | 'org' | 'event' | 'item'
  | 'language' | 'culture' | 'music' | 'work' | 'adaptation' | 'lore'
  | 'date' | 'qa' | 'disambig' | 'misc';

export interface TypeMeta {
  label: string;
  color: string;
  shape: string;      // cytoscape node shape
  glyph: string;      // fallback glyph for placeholders / legends
  blurb: string;
}

export const TYPE_META: Record<string, TypeMeta> = {
  character: { label: '人物', color: '#5f7350', shape: 'ellipse', glyph: '人', blurb: '中洲的居民：国王、霍比特人、精灵、迈雅与反派。' },
  race: { label: '种族', color: '#8a9a72', shape: 'ellipse', glyph: '族', blurb: '精灵、人类、矮人、霍比特人、恩特与其它族群。' },
  place: { label: '地点', color: '#6b5543', shape: 'round-rectangle', glyph: '地', blurb: '山川、城市、森林、河流与道路。' },
  realm: { label: '势力', color: '#b79a5b', shape: 'hexagon', glyph: '国', blurb: '王国、帝国与领地。' },
  org: { label: '组织', color: '#9c7c52', shape: 'octagon', glyph: '组', blurb: '家族、议会、同盟与团体。' },
  event: { label: '事件', color: '#7d6b57', shape: 'diamond', glyph: '事', blurb: '战役、会议、灾变与编年史中的关键时刻。' },
  item: { label: '物品', color: '#a8823f', shape: 'triangle', glyph: '物', blurb: '戒指、武器、宝钻与传家之宝。' },
  language: { label: '语言', color: '#7f8f7a', shape: 'pentagon', glyph: '语', blurb: '精灵语、西部语、黑语与文字系统。' },
  culture: { label: '文化', color: '#95805f', shape: 'round-rectangle', glyph: '文', blurb: '习俗、节庆、历法与生活方式。' },
  music: { label: '音乐', color: '#8a7b5c', shape: 'star', glyph: '乐', blurb: '原声带曲目、诗歌与歌谣。' },
  work: { label: '作品', color: '#5c6b55', shape: 'rectangle', glyph: '书', blurb: '托尔金的原著、章节、书信与研究文献。' },
  adaptation: { label: '改编', color: '#a08d6b', shape: 'rectangle', glyph: '影', blurb: '电影、游戏与其它衍生作品。' },
  lore: { label: '研究', color: '#7a6a4f', shape: 'round-rectangle', glyph: '研', blurb: '托尔金生平、学术与书信。' },
  date: { label: '年代', color: '#9aa38e', shape: 'ellipse', glyph: '时', blurb: '纪年与日期索引。' },
  qa: { label: '问答', color: '#8e9a84', shape: 'diamond', glyph: '问', blurb: '常见疑问与考据。' },
  disambig: { label: '消歧义', color: '#a9a291', shape: 'ellipse', glyph: '歧', blurb: '同名条目的索引页。' },
  misc: { label: '其他', color: '#9a9a8a', shape: 'ellipse', glyph: '·', blurb: '未能归入以上分类的条目。' },
};

export const typeMeta = (t: string): TypeMeta =>
  TYPE_META[t] || { label: t, color: '#9a9a8a', shape: 'ellipse', glyph: '·', blurb: '' };

// Browsing order & the subsets shown in navigation
export const BROWSE_TYPES: EntityType[] = [
  'character', 'race', 'place', 'realm', 'org', 'event',
  'item', 'language', 'culture', 'music', 'work', 'adaptation', 'lore',
];

export const ERAS = ['双树纪元', '第一纪元', '第二纪元', '第三纪元', '第四纪元'] as const;
export type Era = (typeof ERAS)[number];

export const ERA_META: Record<string, { span: string; blurb: string }> = {
  双树纪元: { span: '巨灯熄灭 → 双树被毁', blurb: '维林诺的双圣树照耀中洲之前，精灵在奎维耶能苏醒，米尔寇的阴影渐起。' },
  第一纪元: { span: '日月升起 → 愤怒之战', blurb: '贝烈瑞安德的精灵与人类对抗魔苟斯的漫长战争，以大陆沉没告终。' },
  第二纪元: { span: '努门诺尔兴起 → 最后同盟', blurb: '力量之戒被铸造，努门诺尔盛极而亡，索隆在巴拉督尔崛起又暂时覆灭。' },
  第三纪元: { span: '最后同盟 → 魔戒大战', blurb: '阿尔诺与刚铎的兴衰，魔戒在夏尔沉睡，最终由霍比特人带向末日山。' },
  第四纪元: { span: '埃莱萨王登基 → 人类时代', blurb: '精灵渐次西渡，重联王国建立，中洲进入人类的时代。' },
};

export const ERA_COLORS: Record<string, string> = {
  双树纪元: '#8a9a72',
  第一纪元: '#5c6b55',
  第二纪元: '#b79a5b',
  第三纪元: '#7d6b57',
  第四纪元: '#a9b59b',
};
