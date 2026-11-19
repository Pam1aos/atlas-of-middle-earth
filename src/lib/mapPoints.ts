/**
 * Hand-placed schematic coordinates for the atlas map.
 * They are NOT survey data: the wiki carries no coordinates, so every point is an
 * illustrative placement on a stylised canvas (1000 x 1250), matching the rough
 * relative layout of the well-known map — west coast on the left, Mordor south-east.
 */
export interface RegionPoint {
  name: string;
  x: number;
  y: number;
  faded?: boolean; // sunken / overseas: drawn separately, not on the Third Age landmass
  dotOnly?: boolean;
}

export const REGION_POINTS: RegionPoint[] = [
  // overseas + sunken lands (western margin, deliberately faded)
  { name: '阿门洲', x: 110, y: 230, faded: true },
  { name: '维林诺', x: 110, y: 316, faded: true },
  { name: '努门诺尔', x: 150, y: 520, faded: true },
  { name: '贝烈瑞安德', x: 150, y: 760, faded: true },
  { name: '纳国斯隆德', x: 96, y: 858, faded: true, dotOnly: true },
  { name: '欧西瑞安德', x: 168, y: 900, faded: true, dotOnly: true },
  { name: '奈芙兰斯特', x: 96, y: 930, faded: true, dotOnly: true },

  // Third Age westlands
  { name: '埃利阿多', x: 380, y: 420 },
  { name: '夏尔', x: 338, y: 500 },
  { name: '迷雾山脉', x: 522, y: 604 },
  { name: '埃奈德地区', x: 478, y: 702 },
  { name: '罗瓦尼安', x: 734, y: 620 },
  { name: '洛汗', x: 540, y: 800 },
  { name: '米那斯提力斯', x: 606, y: 896 },
  { name: '刚铎', x: 560, y: 966 },
  { name: '魔多', x: 752, y: 986 },
];

/** a handful of well-known events, placed near where they happened */
export interface EventPoint { title: string; x: number; y: number }
export const EVENT_POINTS: EventPoint[] = [
  { title: '五军之战', x: 712, y: 470 },
  { title: '埃尔隆德的会议', x: 486, y: 448 },
  { title: '绿野之战', x: 366, y: 478 },
  { title: '圣盔谷之战', x: 500, y: 782 },
  { title: '佩兰诺平野之战', x: 620, y: 912 },
  { title: '黑门之战', x: 776, y: 912 },
  { title: '最后联盟大战', x: 756, y: 946 },
  { title: '魔戒大战', x: 626, y: 886 },
];

/** cultural / natural notes per region; names are resolved against real entries at build time */
export const REGION_NOTES: Record<string, string[]> = {
  夏尔: ['霍比特人', '夏尔烟草', '老林', '巴兰都因河'],
  埃利阿多: ['杜内丹人', '布理', '古墓岗', '风云顶'],
  迷雾山脉: ['奥克', '半兽人', '巨鹰', '卡拉兹拉斯'],
  埃奈德地区: ['洛希尔人', '恩特', '范贡森林', '艾森河'],
  洛汗: ['洛希尔人', '梅里阿道克·白兰地鹿', '号角堡', '西伏尔德'],
  刚铎: ['杜内丹人', '刚铎白树', '米那斯提力斯', '佩拉基尔'],
  米那斯提力斯: ['刚铎白树', '埃克塞理安之塔', '帕兰提尔', '喷泉广场'],
  魔多: ['半兽人', '索隆', '末日山', '巴拉督尔'],
  罗瓦尼安: ['精灵', '人类', '黑森林', '孤山'],
  阿门洲: ['维拉', '双圣树', '维林诺', '曼督斯'],
  维林诺: ['维拉', '双圣树', '泰尔佩瑞安', '雅凡娜'],
  努门诺尔: ['杜内丹人', '努门诺尔人', '安督利尔', '宁洛丝'],
  贝烈瑞安德: ['精灵', '魔苟斯', '安格班', '刚多林'],
};
