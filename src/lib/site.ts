export const SITE = {
  name: '中洲志',
  nameEn: 'Atlas of Middle-earth',
  tagline: '一份可检索、可漫游的中洲世界档案',
  description:
    '从魔戒中文维基整理的中洲世界百科：人物、种族、地点、势力、事件与物品，附关系知识图谱与时代年表。',
  url: import.meta.env.SITE_URL || 'https://atlas-of-middle-earth.example',
  repo: 'https://github.com/Pam1aos/atlas-of-middle-earth',
};

export const NAV = [
  { href: '/', label: '首页' },
  { href: '/browse/', label: '百科' },
  { href: '/graph/', label: '图谱' },
  { href: '/timeline/', label: '时代' },
  { href: '/atlas/', label: '地理' },
  { href: '/about/', label: '关于' },
];
