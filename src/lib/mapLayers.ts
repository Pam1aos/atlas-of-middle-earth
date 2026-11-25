/**
 * Political layers for the atlas: realm extents (soft tinted polygons) and
 * flat landmark icons. Coordinates share the traced map's 3200x2400 space.
 */

export interface PowerArea {
  name: string;
  d: string;
  color: string;
  label?: { x: number; y: number };
}

export const POWER_AREAS: PowerArea[] = [
  {
    name: '阿尔诺 / 埃利阿多',
    color: '#b7c79a',
    label: { x: 1040, y: 780 },
    d: 'M820 500 C 940 460, 1120 470, 1240 520 C 1330 560, 1350 660, 1300 760 C 1250 860, 1130 920, 1000 930 C 870 940, 780 880, 760 780 C 742 690, 760 560, 820 500 Z',
  },
  {
    name: '夏尔',
    color: '#a8c07f',
    label: { x: 940, y: 640 },
    d: 'M842 606 C 890 580, 980 582, 1024 610 C 1060 634, 1058 690, 1026 714 C 986 744, 892 742, 852 712 C 820 688, 816 630, 842 606 Z',
  },
  {
    name: '林顿',
    color: '#9fb8a1',
    label: { x: 420, y: 640 },
    d: 'M300 520 C 380 500, 470 530, 500 600 C 528 668, 500 760, 440 800 C 380 840, 310 810, 288 740 C 266 668, 262 552, 300 520 Z',
  },
  {
    name: '洛汗',
    color: '#c9a55e',
    label: { x: 1600, y: 1390 },
    d: 'M1420 1260 C 1540 1210, 1720 1220, 1810 1280 C 1880 1330, 1870 1440, 1800 1490 C 1710 1550, 1530 1540, 1450 1480 C 1380 1428, 1360 1300, 1420 1260 Z',
  },
  {
    name: '刚铎',
    color: '#7f9c5c',
    label: { x: 1810, y: 1830 },
    d: 'M1660 1520 C 1800 1470, 1980 1500, 2060 1570 C 2130 1632, 2120 1780, 2050 1870 C 1970 1970, 1790 2000, 1690 1930 C 1600 1868, 1580 1700, 1620 1600 C 1638 1560, 1646 1532, 1660 1520 Z',
  },
  {
    name: '魔多',
    color: '#8a5a4a',
    label: { x: 2260, y: 1770 },
    d: 'M2120 1480 C 2280 1430, 2460 1470, 2520 1560 C 2580 1650, 2540 1800, 2440 1870 C 2320 1950, 2160 1930, 2090 1830 C 2030 1742, 2050 1540, 2120 1480 Z',
  },
  {
    name: '洛丝罗瑞恩',
    color: '#9fb86a',
    label: { x: 1690, y: 1140 },
    d: 'M1600 1090 C 1670 1064, 1760 1080, 1790 1130 C 1820 1180, 1790 1240, 1720 1256 C 1650 1272, 1570 1246, 1556 1196 C 1544 1152, 1560 1104, 1600 1090 Z',
  },
  {
    name: '幽暗密林',
    color: '#5f7d42',
    label: { x: 1930, y: 900 },
    d: 'M1820 660 C 1940 620, 2080 660, 2120 760 C 2160 860, 2140 1010, 2050 1080 C 1960 1150, 1820 1120, 1780 1020 C 1740 920, 1740 700, 1820 660 Z',
  },
  {
    name: '孤山与铁丘陵',
    color: '#9a7b52',
    label: { x: 2230, y: 380 },
    d: 'M2080 340 C 2200 300, 2380 320, 2460 380 C 2520 428, 2500 500, 2420 520 C 2320 546, 2150 530, 2090 480 C 2040 440, 2040 380, 2080 340 Z',
  },
  {
    name: '鲁恩',
    color: '#b08d63',
    label: { x: 2780, y: 960 },
    d: 'M2620 780 C 2760 740, 2920 780, 2980 870 C 3040 960, 3010 1090, 2920 1140 C 2820 1196, 2660 1160, 2610 1070 C 2560 980, 2570 820, 2620 780 Z',
  },
  {
    name: '哈拉德',
    color: '#c2a273',
    label: { x: 2360, y: 2180 },
    d: 'M1980 2040 C 2140 1990, 2380 2010, 2520 2080 C 2640 2140, 2620 2240, 2500 2270 C 2360 2304, 2120 2290, 2010 2230 C 1930 2186, 1930 2070, 1980 2040 Z',
  },
  {
    name: '佛洛德瓦耶',
    color: '#a9bcc4',
    label: { x: 1200, y: 170 },
    d: 'M700 200 C 900 150, 1300 150, 1560 190 C 1740 216, 1800 258, 1740 292 C 1620 352, 1100 348, 840 312 C 706 292, 660 240, 700 200 Z',
  },
  {
    name: '艾辛格',
    color: '#7d8f6a',
    label: { x: 1440, y: 1240 },
    d: 'M1376 1224 C 1410 1204, 1480 1206, 1510 1230 C 1540 1254, 1534 1300, 1500 1316 C 1460 1336, 1396 1330, 1374 1300 C 1356 1276, 1356 1240, 1376 1224 Z',
  },
];

export type LandmarkIcon = 'city' | 'fortress' | 'tower' | 'port' | 'gate' | 'mountain' | 'forest' | 'village' | 'ruin';

export interface Landmark {
  title: string;
  x: number;
  y: number;
  icon: LandmarkIcon;
}

export const LANDMARKS: Landmark[] = [
  { title: '米那斯提力斯', x: 1812, y: 1652, icon: 'city' },
  { title: '奥斯吉力亚斯', x: 1846, y: 1738, icon: 'ruin' },
  { title: '米纳斯魔窟', x: 1926, y: 1690, icon: 'tower' },
  { title: '巴拉督尔', x: 2196, y: 1594, icon: 'tower' },
  { title: '黑门', x: 2032, y: 1516, icon: 'gate' },
  { title: '圣盔谷', x: 1566, y: 1444, icon: 'fortress' },
  { title: '艾辛格', x: 1442, y: 1284, icon: 'tower' },
  { title: '瑞文戴尔', x: 1146, y: 866, icon: 'village' },
  { title: '摩瑞亚', x: 1584, y: 1086, icon: 'gate' },
  { title: '洛丝罗瑞恩', x: 1666, y: 1176, icon: 'forest' },
  { title: '孤山', x: 2186, y: 404, icon: 'mountain' },
  { title: '长湖镇', x: 2124, y: 468, icon: 'port' },
  { title: '灰港', x: 402, y: 656, icon: 'port' },
  { title: '布理', x: 934, y: 796, icon: 'village' },
  { title: '多古尔都', x: 2004, y: 1000, icon: 'tower' },
  { title: '范贡森林', x: 1446, y: 1300, icon: 'forest' },
  { title: '伊希利恩', x: 1922, y: 1800, icon: 'forest' },
  { title: '佩拉基尔', x: 1836, y: 1904, icon: 'port' },
  { title: '安格玛', x: 1386, y: 396, icon: 'ruin' },
  { title: '塔巴德', x: 1502, y: 902, icon: 'village' },
];

/** 24x24 flat glyphs, drawn on a shared baseline */
export const ICON_PATHS: Record<LandmarkIcon, string> = {
  city: 'M4 20h16v-9l-3-3-3 3V7l-3-3-3 3v3L5 11l-1 9Zm3-3h2v-3H7v3Zm8 0h2v-3h-2v3Z',
  fortress: 'M3 20h18v-7l-2-2h-3v2h-2v-2H10v2H8v-2H5l-2 2v7Zm4-2h3v-3H7v3Zm7 0h3v-3h-3v3Z',
  tower: 'M9 21h6v-9l-3-4-3 4v9Zm1-11 .5-3h3l.5 3H10Z',
  port: 'M12 3 7 9h4v6h2V9h4l-5-6ZM4 18c2 2 4 3 8 3s6-1 8-3l-1-2c-2 2-4 3-7 3s-5-1-7-3l-1 2Z',
  gate: 'M5 21h3v-7a4 4 0 0 1 8 0v7h3V14a7 7 0 0 0-14 0v7Z',
  mountain: 'M3 19h18L14 6l-3 5-2-2-6 10Z',
  forest: 'M9 21h6l-1-5h2L11 4 6 16h2l-1 5Zm8 0h5l-1-4h1l-3-7-2 4h1l-1 7Z',
  village: 'M4 20h6v-5l3-3 3 3v5h4V12l-7-7-9 9v6Z',
  ruin: 'M4 20h5v-4l3 1v3h3v-3l3-1v4h2V10l-4-3-3 2-3-2-4 3v10Z',
};
