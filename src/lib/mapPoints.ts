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
  { title: '芬国昐的陨落', x: 500, y: 430 },
  { title: '巴拉督尔围城', x: 744, y: 962 },
  { title: '阿蒙苏尔之战', x: 596, y: 952 },
  { title: '绿野之战', x: 352, y: 506 },
  { title: '佛诺斯特之战', x: 402, y: 330 },
  { title: '凯勒布兰特原野之战', x: 610, y: 700 },
  { title: '埃瑞吉安之劫', x: 470, y: 640 },
  { title: '努门诺尔的沦亡', x: 150, y: 520 },
  { title: '最后联盟大战', x: 756, y: 946 },
  { title: '黑门之战', x: 776, y: 912 },
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

/** tinted area polygons — schematic regional divisions, drawn under the labels */
export interface AreaPolygon { name: string; d: string; color: string }
export const REGION_AREAS: AreaPolygon[] = [
  { name: '佛洛德瓦耶', d: 'M300 190 C 420 160, 570 162, 668 200 L 660 262 C 560 232, 420 232, 306 258 Z', color: '#b9c8a4' },
  { name: '林顿', d: 'M238 340 C 268 330, 300 348, 296 392 L 286 500 C 268 512, 248 498, 240 470 Z', color: '#a8bd8f' },
  { name: '埃利阿多', d: 'M300 330 C 380 316, 462 330, 486 372 L 470 520 C 430 556, 350 556, 300 520 Z', color: '#c2d2ac' },
  { name: '罗瓦尼安', d: 'M616 300 C 700 286, 790 300, 840 340 L 838 560 C 790 604, 700 610, 640 578 Z', color: '#aec48f' },
  { name: '洛汗', d: 'M430 736 C 500 716, 588 720, 636 748 L 630 856 C 570 880, 470 878, 426 852 Z', color: '#d8c69a' },
  { name: '刚铎', d: 'M452 860 C 520 846, 606 852, 650 878 L 646 1046 C 590 1082, 490 1076, 452 1040 Z', color: '#b6c79c' },
  { name: '魔多', d: 'M664 884 C 748 858, 812 878, 828 924 L 800 1030 C 740 1054, 676 1040, 660 998 Z', color: '#b08d73' },
  { name: '哈拉德', d: 'M400 1092 C 500 1076, 640 1084, 700 1108 L 660 1140 C 560 1156, 460 1148, 406 1128 Z', color: '#cbb08c' },
];

/** flora and fauna pinned to where they belong in the stories */
export interface NaturePoint { title: string; slug?: string; x: number; y: number; kind: 'plant' | 'beast' }
export const NATURE_POINTS: NaturePoint[] = [
  { title: '恩特（范贡森林）', slug: '恩特', x: 496, y: 782, kind: 'beast' },
  { title: '巨鹰（迷雾山脉）', slug: '巨鹰', x: 508, y: 512, kind: 'beast' },
  { title: '斯毛格（孤山）', slug: '斯毛格', x: 716, y: 452, kind: 'beast' },
  { title: '大蜘蛛（大绿林）', slug: '希洛布', x: 688, y: 470, kind: 'beast' },
  { title: '刚铎白树', slug: '刚铎白树', x: 618, y: 890, kind: 'plant' },
  { title: '夏尔烟草', slug: '夏尔烟草', x: 330, y: 512, kind: 'plant' },
  { title: '洛希尔骏马', slug: '洛希尔人', x: 566, y: 824, kind: 'beast' },
  { title: '奥克（魔多）', slug: '奥克', x: 726, y: 966, kind: 'beast' },
  { title: '座狼（安格玛）', slug: '座狼', x: 588, y: 262, kind: 'beast' },
  { title: '黄金森林（洛丝罗瑞恩）', slug: '洛丝罗瑞恩', x: 566, y: 700, kind: 'plant' },
  { title: '老林（柳树）', slug: '老林', x: 372, y: 480, kind: 'plant' },
  { title: '宁洛丝（努门诺尔）', slug: '宁洛丝', x: 132, y: 520, kind: 'plant' },
];