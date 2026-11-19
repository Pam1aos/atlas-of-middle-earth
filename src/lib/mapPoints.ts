/**
 * Marker coordinates live in the traced map's pixel space (viewBox 0 0 3200 2400).
 * Each marker is resolved against the entity index at build time, so hovering a
 * marker can show the entry's picture and a one-line summary.
 */
export interface Marker {
  title: string;
  x: number;
  y: number;
  kind: 'region' | 'people' | 'event' | 'nature' | 'plant';
  offmap?: boolean;
}

export const MAP_VIEWBOX = { w: 3200, h: 2400 };

export const REGIONS: Marker[] = [
  { title: '埃利阿多', x: 1000, y: 840, kind: 'region' },
  { title: '夏尔', x: 940, y: 660, kind: 'region' },
  { title: '迷雾山脉', x: 1600, y: 1040, kind: 'region' },
  { title: '埃奈德地区', x: 1440, y: 1280, kind: 'region' },
  { title: '罗瓦尼安', x: 1800, y: 1120, kind: 'region' },
  { title: '洛汗', x: 1600, y: 1380, kind: 'region' },
  { title: '米那斯提力斯', x: 1800, y: 1660, kind: 'region' },
  { title: '刚铎', x: 1760, y: 1700, kind: 'region' },
  { title: '魔多', x: 2300, y: 1760, kind: 'region' },

  // west of the frame: list only
  { title: '阿门洲', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '维林诺', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '努门诺尔', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '贝烈瑞安德', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '纳国斯隆德', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '欧西瑞安德', x: 0, y: 0, kind: 'region', offmap: true },
  { title: '奈芙兰斯特', x: 0, y: 0, kind: 'region', offmap: true },
];

/** peoples and their homelands */
export const PEOPLES: Marker[] = [
  { title: '霍比特人', x: 900, y: 690, kind: 'people' },
  { title: '布理人', x: 930, y: 800, kind: 'people' },
  { title: '杜内丹人', x: 1080, y: 760, kind: 'people' },
  { title: '西尔凡精灵', x: 1930, y: 900, kind: 'people' },
  { title: '矮人', x: 2160, y: 470, kind: 'people' },
  { title: '洛希尔人', x: 1580, y: 1350, kind: 'people' },
  { title: '刚铎人', x: 1820, y: 1720, kind: 'people' },
  { title: '努门诺尔人', x: 1830, y: 1880, kind: 'people' },
  { title: '哈拉德人', x: 2480, y: 2160, kind: 'people' },
  { title: '东夷人', x: 2780, y: 1080, kind: 'people' },
  { title: '奥克', x: 2280, y: 1720, kind: 'people' },
  { title: '恩特', x: 1450, y: 1300, kind: 'people' },
];

/** battles, councils and disasters — 24 of them */
export const EVENTS: Marker[] = [
  { title: '芬国昐的陨落', x: 1600, y: 980, kind: 'event' },
  { title: '骤火之战', x: 1560, y: 900, kind: 'event' },
  { title: '泪雨之战', x: 1500, y: 860, kind: 'event' },
  { title: '努门诺尔的沦亡', x: 700, y: 900, kind: 'event' },
  { title: '最后联盟大战', x: 2180, y: 1600, kind: 'event' },
  { title: '埃瑞吉安之劫', x: 1420, y: 1180, kind: 'event' },
  { title: '凯勒布兰特原野之战', x: 1660, y: 1180, kind: 'event' },
  { title: '佛诺斯特之战', x: 1120, y: 700, kind: 'event' },
  { title: '绿野之战', x: 900, y: 640, kind: 'event' },
  { title: '五军之战', x: 2180, y: 410, kind: 'event' },
  { title: '埃尔隆德的会议', x: 1140, y: 870, kind: 'event' },
  { title: '摩瑞亚之战', x: 1580, y: 1090, kind: 'event' },
  { title: '阿蒙汉之战', x: 1720, y: 1150, kind: 'event' },
  { title: '圣盔谷之战', x: 1560, y: 1440, kind: 'event' },
  { title: '艾森河渡口之战', x: 1500, y: 1360, kind: 'event' },
  { title: '法贡森林会面', x: 1450, y: 1290, kind: 'event' },
  { title: '奥斯吉力亚斯之战', x: 1830, y: 1730, kind: 'event' },
  { title: '佩兰诺平野之战', x: 1800, y: 1660, kind: 'event' },
  { title: '米纳斯魔窟之战', x: 1900, y: 1700, kind: 'event' },
  { title: '达戈拉德之战', x: 1900, y: 1500, kind: 'event' },
  { title: '黑门之战', x: 2020, y: 1520, kind: 'event' },
  { title: '巴拉督尔围城', x: 2180, y: 1600, kind: 'event' },
  { title: '魔戒大战', x: 2060, y: 1700, kind: 'event' },
  { title: '夏尔清剿', x: 930, y: 700, kind: 'event' },
];

/** creatures and plants pinned where the stories put them */
export const NATURE: Marker[] = [
  { title: '巨鹰', x: 1600, y: 1000, kind: 'nature' },
  { title: '斯毛格', x: 2180, y: 390, kind: 'nature' },
  { title: '希洛布', x: 1900, y: 860, kind: 'nature' },
  { title: '座狼', x: 1380, y: 400, kind: 'nature' },
  { title: '猛犸', x: 2500, y: 2120, kind: 'nature' },
  { title: '胡恩', x: 1620, y: 1160, kind: 'nature' },
  { title: '咕噜', x: 1580, y: 1060, kind: 'nature' },
  { title: '老林', x: 1010, y: 880, kind: 'plant' },
  { title: '范贡森林', x: 1450, y: 1300, kind: 'plant' },
  { title: '洛丝罗瑞恩', x: 1660, y: 1180, kind: 'plant' },
  { title: '刚铎白树', x: 1810, y: 1650, kind: 'plant' },
  { title: '夏尔烟草', x: 930, y: 650, kind: 'plant' },
  { title: '阿塞拉斯', x: 1840, y: 1780, kind: 'plant' },
  { title: '宁洛丝', x: 700, y: 880, kind: 'plant' },
  { title: '瑁珑树', x: 1670, y: 1190, kind: 'plant' },
];

/** cultural / natural notes per region; resolved against real entries at build time */
export const REGION_NOTES: Record<string, string[]> = {
  夏尔: ['霍比特人', '夏尔烟草', '老林', '布理'],
  埃利阿多: ['杜内丹人', '布理', '古墓岗', '风云顶'],
  迷雾山脉: ['奥克', '巨鹰', '摩瑞亚', '卡拉兹拉斯'],
  埃奈德地区: ['洛希尔人', '恩特', '范贡森林', '艾森河'],
  洛汗: ['洛希尔人', '号角堡', '西伏尔德', '伊奥梅尔'],
  刚铎: ['刚铎人', '刚铎白树', '米那斯提力斯', '佩拉基尔'],
  米那斯提力斯: ['刚铎白树', '帕兰提尔', '奥斯吉力亚斯', '米那斯魔窟'],
  魔多: ['奥克', '索隆', '末日山', '巴拉督尔'],
  罗瓦尼安: ['西尔凡精灵', '黑森林', '孤山', '长湖镇'],
  阿门洲: ['维拉', '双圣树', '维林诺', '曼督斯'],
  维林诺: ['维拉', '双圣树', '雅凡娜', '泰尔佩瑞安'],
  努门诺尔: ['努门诺尔人', '安督利尔', '宁洛丝', '塔尔-米那斯提尔'],
  贝烈瑞安德: ['精灵', '魔苟斯', '安格班', '刚多林'],
};