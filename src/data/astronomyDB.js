export const astronomyDB = {
  "M31": {
    "name": "M31 / 仙女座星系 (Andromeda Galaxy)",
    "type": "旋渦星系 (Spiral)",
    "distance": "254 萬光年",
    "size": "220,000 光年 (直徑)",
    "magnitude": "3.44",
    "description": "這是距離銀河系最近的大型星系，包含約一兆顆恆星。它與銀河系正以每秒 110 公里的速度互相靠近，預計在 40 億年後發生碰撞並合併成一個更大的橢圓星系。"
  },
  "M42": {
    "name": "M42 / 獵戶座大星雲 (Orion Nebula)",
    "type": "發射星雲 (Emission Nebula)",
    "distance": "1,344 光年",
    "size": "24 光年 (直徑)",
    "magnitude": "4.0",
    "description": "它是天空中最明亮的星雲之一，也是恆星誕生的溫床。在獵戶座腰帶下方的「佩劍」位置，肉眼即可看見其微弱的光斑。"
  },
  "M45": {
    "name": "M45 / 昴宿星團 (Pleiades)",
    "type": "疏散星團 (Open Cluster)",
    "distance": "444 光年",
    "size": "17.5 光年 (核心)",
    "magnitude": "1.6",
    "description": "俗稱「七姊妹星團」，是距離地球最近且最明顯的星團之一。包含許多明亮的藍色 B 型恆星，周圍環繞著幽藍色的反射星雲。"
  },
  "M51": {
    "name": "M51 / 渦狀星系 (Whirlpool Galaxy)",
    "type": "旋渦星系 (Spiral)",
    "distance": "2,300 萬光年",
    "size": "76,000 光年 (直徑)",
    "magnitude": "8.4",
    "description": "一對正在發生相互作用的星系，巨大的主體旋渦星系正與較小的矮星系合併。這是天文愛好者最喜愛的觀測目標之一。"
  },
  "M8": {
    "name": "M8 / 礁湖星雲 (Lagoon Nebula)",
    "type": "發射星雲 (Emission Nebula)",
    "distance": "4,100 光年",
    "size": "55 × 20 光年",
    "magnitude": "6.0",
    "description": "位於人馬座的巨大星際雲氣，包含許多年輕的星團與密集的恆星誕生區。它的名稱來自其中心那條明顯的黑塵帶。"
  },
  "M1": {
    "name": "M1 / 蟹狀星雲 (Crab Nebula)",
    "type": "超新星殘骸 (Supernova Remnant)",
    "distance": "6,500 光年",
    "size": "11 光年 (直徑)",
    "magnitude": "8.4",
    "description": "這是西元 1054 年一次著名超新星爆炸後的遺蹟。其中心擁有一顆每秒自轉 30 次的強大脈衝星。"
  },
  "M33": {
    "name": "M33 / 三角座星系 (Triangulum Galaxy)",
    "type": "旋渦星系 (Spiral)",
    "distance": "273 萬光年",
    "size": "60,000 光年 (直徑)",
    "magnitude": "5.72",
    "description": "本星系群中的第三大星系，僅次於仙女座星系與銀河系。它擁有非常清晰的旋臂結構與大量的恆星誕生區。"
  },
  "NGC 224": { "alias": "M31" },
  "NGC 1976": { "alias": "M42" },
  "NGC 5194": { "alias": "M51" },
  "NGC 598": { "alias": "M33" },
  "Andromeda": { "alias": "M31" },
  "Orion Nebula": { "alias": "M42" }
};

export const getObjectInfo = (name) => {
  // 嘗試匹配常見縮寫
  const normalized = name.toUpperCase().replace(/\s/g, '');
  const entry = astronomyDB[normalized] || astronomyDB[name];
  
  if (entry && entry.alias) {
    return astronomyDB[entry.alias];
  }
  return entry;
};
