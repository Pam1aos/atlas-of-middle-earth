/**
 * Coordinates are in the pixel space of the traced map (viewBox 0 0 3200 2400),
 * read off the uploaded Map_of_Middle-Earth.svg. Regions west of the map frame
 * (Aman, Númenor, Beleriand) are marked offmap and only appear in the list.
 */
export interface RegionPoint {
  name: string;
  x: number;
  y: number;
  offmap?: boolean;
}

export const MAP_VIEWBOX = { w: 3200, h: 2400 };

export const REGION_POINTS: RegionPoint[] = [
  { name: '埃利阿多', x: 1000, y: 840 },
  { name: '夏尔', x: 940, y: 660 },
  { name: '迷雾山脉', x: 1600, y: 1040 },
  { name: '埃奈德地区', x: 1440, y: 1280 },
  { name: '罗瓦尼安', x: 1800, y: 1120 },
  { name: '洛汗', x: 1600, y: 1380 },
  { name: '米那斯提力斯', x: 1800, y: 1660 },
  { name: '刚铎', x: 1760, y: 1700 },
  { name: '魔多', x: 2300, y: 1760 },

  // 海外与已沉没，不在这张图上
  { name: '阿门洲', x: 0, y: 0, offmap: true },
  { name: '维林诺', x: 0, y: 0, offmap: true },
  { name: '努门诺尔', x: 0, y: 0, offmap: true },
  { name: '贝烈瑞安德', x: 0, y: 0, offmap: true },
  { name: '纳国斯隆德', x: 0, y: 0, offmap: true },
  { name: '欧西瑞安德', x: 0, y: 0, offmap: true },
  { name: '奈芙兰斯特', x: 0, y: 0, offmap: true },
];

export interface EventPoint { title: string; x: number; y: number }
export const EVENT_POINTS: EventPoint[] = [
  { title: '五军之战', x: 2180, y: 410 },
  { title: '埃尔隆德的会议', x: 1140, y: 870 },
  { title: '绿野之战', x: 900, y: 640 },
  { title: '圣盔谷之战', x: 1560, y: 1440 },
  { title: '佩兰诺平野之战', x: 1800, y: 1660 },
  { title: '黑门之战', x: 2020, y: 1520 },
  { title: '达戈拉德之战', x: 1900, y: 1500 },
  { title: '最后联盟大战', x: 2180, y: 1600 },
  { title: '巴拉督尔围城', x: 2180, y: 1600 },
  { title: '弗诺斯特之战', x: 1120, y: 700 },
  { title: '凯勒布兰特原野之战', x: 1660, y: 1180 },
  { title: '埃瑞吉安之劫', x: 1420, y: 1180 },
  { title: '魔戒大战', x: 2060, y: 1700 },
];

export interface NaturePoint { title: string; slug?: string; x: number; y: number; kind: 'plant' | 'beast' }
export const NATURE_POINTS: NaturePoint[] = [
  { title: '恩特（范贡森林）', slug: '恩特', x: 1440, y: 1300, kind: 'beast' },
  { title: '巨鹰（迷雾山脉）', slug: '巨鹰', x: 1600, y: 980, kind: 'beast' },
  { title: '斯毛格（孤山）', slug: '斯毛格', x: 2180, y: 390, kind: 'beast' },
  { title: '大蜘蛛（大绿林）', slug: '希洛布', x: 1900, y: 860, kind: 'beast' },
  { title: '刚铎白树', slug: '刚铎白树', x: 1810, y: 1650, kind: 'plant' },
  { title: '夏尔烟草', slug: '夏尔烟草', x: 930, y: 650, kind: 'plant' },
  { title: '洛希尔骏马', slug: '洛希尔人', x: 1600, y: 1370, kind: 'beast' },
  { title: '奥克（魔多）', slug: '奥克', x: 2300, y: 1740, kind: 'beast' },
  { title: '座狼（安格玛）', slug: '座狼', x: 1380, y: 400, kind: 'beast' },
  { title: '黄金森林（洛丝罗瑞恩）', slug: '洛丝罗瑞恩', x: 1660, y: 1180, kind: 'plant' },
  { title: '老林', slug: '老林', x: 1010, y: 880, kind: 'plant' },
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
