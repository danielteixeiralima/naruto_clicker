const heroesData = [
    { id: 1, name: "Naruto Uzumaki", baseCost: 10, baseDps: 1, img: "./static/img/heroes/icons/naruto_icon.png", focus: "center center", element: "wind" },
    { id: 2, name: "Sasuke Uchiha", baseCost: 100, baseDps: 5, img: "./static/img/heroes/icons/sasuke_icon.png", focus: "center center", element: "fire" },
    { id: 3, name: "Sakura Haruno", baseCost: 500, baseDps: 12, img: "./static/img/heroes/icons/sakura_icon.png", focus: "center center", element: "water" },
    { id: 4, name: "Kiba Inuzuka", baseCost: 1000, baseDps: 25, img: "./static/img/heroes/icons/kiba_icon.png", element: "wind" },
    { id: 5, name: "Shino Aburame", baseCost: 2500, baseDps: 50, img: "./static/img/heroes/icons/shino_icon.png", element: "water" },
    { id: 6, name: "Hinata Hyuga", baseCost: 5000, baseDps: 80, img: "./static/img/heroes/icons/hinata_icon.png", element: "water" },
    { id: 7, name: "Shikamaru Nara", baseCost: 12000, baseDps: 150, img: "./static/img/heroes/icons/shikamaru_icon.png", element: "earth" },
    { id: 8, name: "Choji Akimichi", baseCost: 25000, baseDps: 300, img: "./static/img/heroes/icons/choji_icon.png", element: "fire" },
    { id: 9, name: "Ino Yamanaka", baseCost: 60000, baseDps: 550, img: "./static/img/heroes/icons/ino_icon.png", element: "fire" },
    { id: 10, name: "Rock Lee", baseCost: 150000, baseDps: 1000, img: "./static/img/heroes/icons/lee_icon.png", element: null },
    { id: 11, name: "Tenten", baseCost: 400000, baseDps: 2200, img: "./static/img/heroes/icons/tenten_icon.png", element: "lightning" },
    { id: 12, name: "Neji", baseCost: 1000000, baseDps: 4500, img: "./static/img/heroes/icons/neji_icon.png", element: "lightning" },
    { id: 13, name: "Gaara", baseCost: 2500000, baseDps: 9000, img: "./static/img/heroes/icons/gaara_icon.png", element: "earth" },
    { id: 14, name: "Temari", baseCost: 6000000, baseDps: 18000, img: "./static/img/heroes/icons/temari_icon.png", element: "wind" },
    { id: 15, name: "Kankuro", baseCost: 15000000, baseDps: 40000, img: "./static/img/heroes/icons/kankuro_icon.png", element: "earth" },
    { id: 16, name: "Iruka Umino", baseCost: 40000000, baseDps: 90000, img: "https://placehold.co/100x100/4a3b2a/ffffff?text=Iruka" },
    { id: 17, name: "Mizuki", baseCost: 100000000, baseDps: 200000, img: "https://placehold.co/100x100/555555/ffffff?text=Mizuki" },
    { id: 18, name: "Konohamaru", baseCost: 300000000, baseDps: 500000, img: "https://placehold.co/100x100/ffd700/000000?text=Konohamaru" },
    { id: 19, name: "Haku", baseCost: 800000000, baseDps: 1200000, img: "https://placehold.co/100x100/add8e6/000000?text=Haku" },
    { id: 20, name: "Zabuza", baseCost: 2000000000, baseDps: 3000000, img: "https://placehold.co/100x100/2f4f4f/ffffff?text=Zabuza" },
    { id: 21, name: "Kabuto", baseCost: 5000000000, baseDps: 7000000, img: "https://placehold.co/100x100/4b0082/ffffff?text=Kabuto" },
    { id: 22, name: "Kimimaro", baseCost: 12000000000, baseDps: 15000000, img: "https://placehold.co/100x100/f5f5f5/000000?text=Kimimaro" },
    { id: 23, name: "Itachi", baseCost: 30000000000, baseDps: 35000000, img: "https://placehold.co/100x100/000000/ff0000?text=Itachi" },
    { id: 24, name: "Kisame", baseCost: 80000000000, baseDps: 85000000, img: "https://placehold.co/100x100/000080/ffffff?text=Kisame" },
    { id: 25, name: "Jiraiya", baseCost: 200000000000, baseDps: 200000000, img: "https://placehold.co/100x100/8b4513/ffffff?text=Jiraiya" },
    { id: 26, name: "Tsunade", baseCost: 500000000000, baseDps: 500000000, img: "https://placehold.co/100x100/98fb98/000000?text=Tsunade" },
    { id: 27, name: "Orochimaru", baseCost: 1500000000000, baseDps: 1200000000, img: "https://placehold.co/100x100/483d8b/ffffff?text=Orochimaru" },
    { id: 28, name: "Kakashi", baseCost: 4000000000000, baseDps: 3000000000, img: "https://placehold.co/100x100/778899/ffffff?text=Kakashi" },
    { id: 29, name: "Guy", baseCost: 10000000000000, baseDps: 7000000000, img: "https://placehold.co/100x100/006400/ffffff?text=Might+Guy" },
    { id: 30, name: "Asuma", baseCost: 25000000000000, baseDps: 15000000000, img: "https://placehold.co/100x100/2f4f4f/ffffff?text=Asuma" },
    { id: 31, name: "Yamato", baseCost: 70000000000000, baseDps: 40000000000, img: "https://placehold.co/100x100/8b4513/ffffff?text=Yamato" },
    { id: 32, name: "Sai", baseCost: 200000000000000, baseDps: 100000000000, img: "https://placehold.co/100x100/000000/ffffff?text=Sai" },
    { id: 33, name: "Deidara", baseCost: 600000000000000, baseDps: 300000000000, img: "https://placehold.co/100x100/ffd700/000000?text=Deidara" },
    { id: 34, name: "Sasori", baseCost: 2000000000000000, baseDps: 800000000000, img: "https://placehold.co/100x100/8b0000/ffffff?text=Sasori" },
    { id: 35, name: "Hidan", baseCost: 7000000000000000, baseDps: 2500000000000, img: "https://placehold.co/100x100/dc143c/ffffff?text=Hidan" },
    { id: 36, name: "Kakuzu", baseCost: 25000000000000000, baseDps: 8000000000000, img: "https://placehold.co/100x100/2f4f4f/ffffff?text=Kakuzu" },
    { id: 37, name: "Pain", baseCost: 100000000000000000, baseDps: 30000000000000, img: "https://placehold.co/100x100/ff4500/ffffff?text=Pain" },
    { id: 38, name: "Konan", baseCost: 500000000000000000, baseDps: 150000000000000, img: "https://placehold.co/100x100/4169e1/ffffff?text=Konan" },
    { id: 39, name: "Obito", baseCost: 2000000000000000000, baseDps: 800000000000000, img: "https://placehold.co/100x100/4b0082/ffffff?text=Obito" },
    { id: 40, name: "Madara", baseCost: 10000000000000000000, baseDps: 5000000000000000, img: "https://placehold.co/100x100/800000/ffffff?text=Madara" }
];

// Definição Manual de Skills para os Principais (Fiel ao Anime)
const specificUpgrades = {
    1: [ // Naruto
        { id: "h1_u1", reqLevel: 20, type: "SELF_DPS_MULT", value: 2, costMultiplier: 10, icon: "./static/img/skills/skill_1_1.png", name: "Kage Bunshin no Jutsu", desc: "DPS do Naruto x2" },
        { id: "h1_u2", reqLevel: 40, type: "SELF_DPS_MULT", value: 2, costMultiplier: 50, icon: "./static/img/skills/skill_1_2.png", name: "Tajuu Kage Bunshin", desc: "Dano de Clique x2" },
        { id: "h1_u3", reqLevel: 60, type: "GLOBAL_DPS_MULT", value: 1.1, costMultiplier: 200, icon: "./static/img/skills/skill_1_3.png", name: "Rasengan", desc: "DPS de Todos +10%" },
        { id: "h1_u4", reqLevel: 80, type: "CRIT_CHANCE", value: 0.01, costMultiplier: 1000, icon: "./static/img/skills/skill_1_4.png", name: "Chakra da Kyuubi", desc: "Chance Crítica +1%" }
    ],
    2: [ // Sasuke
        { id: "h2_u1", reqLevel: 20, type: "SELF_DPS_MULT", value: 2, costMultiplier: 10, icon: "./static/img/skills/skill_3_1.png", name: "Sharingan", desc: "DPS do Sasuke x2" },
        { id: "h2_u2", reqLevel: 40, type: "SELF_DPS_MULT", value: 2, costMultiplier: 50, icon: "./static/img/skills/skill_3_2.png", name: "Chidori", desc: "DPS do Sasuke x2" },
        { id: "h2_u3", reqLevel: 60, type: "GLOBAL_DPS_MULT", value: 1.1, costMultiplier: 200, icon: "./static/img/skills/skill_3_3.png", name: "Katon: Goukakyuu no Jutsu", desc: "DPS de Todos +10%" },
        { id: "h2_u4", reqLevel: 80, type: "CRIT_CHANCE", value: 0.01, costMultiplier: 1000, icon: "./static/img/skills/skill_3_4.png", name: "Shurikenjutsu Uchiha", desc: "Chance Crítica +1%" }
    ],
    3: [ // Sakura
        { id: "h3_u1", reqLevel: 20, type: "SELF_DPS_MULT", value: 2, costMultiplier: 10, icon: "./static/img/skills/skill_2_1.png", name: "Controle Preciso de Chakra", desc: "DPS da Sakura x2" },
        { id: "h3_u2", reqLevel: 40, type: "GLOBAL_DPS_MULT", value: 1.1, costMultiplier: 50, icon: "./static/img/skills/skill_2_2.png", name: "Golpe de Fôrça Concentrada", desc: "DPS de Todos +10%" },
        { id: "h3_u3", reqLevel: 60, type: "SELF_DPS_MULT", value: 2, costMultiplier: 200, icon: "./static/img/skills/skill_2_3.png", name: "Análise de Combate", desc: "DPS da Sakura x2" },
        { id: "h3_u4", reqLevel: 80, type: "GLOBAL_DPS_MULT", value: 1.2, costMultiplier: 1000, icon: "./static/img/skills/skill_2_4.png", name: "Resistência Mental", desc: "DPS de Todos +20%" }
    ]
};

const heroUpgrades = {}; // Map heroId -> Array of upgrades

heroesData.forEach(hero => {
    if (specificUpgrades[hero.id]) {
        heroUpgrades[hero.id] = specificUpgrades[hero.id].map(u => ({ ...u, heroId: hero.id }));
    } else {
        // Gerador Genérico Temático
        heroUpgrades[hero.id] = [
            {
                id: `h${hero.id}_u1`,
                heroId: hero.id,
                reqLevel: 20,
                type: "SELF_DPS_MULT",
                value: 2,
                costMultiplier: 10,
                icon: "🗡️",
                name: `Técnica Secreta I`,
                desc: "Dano deste herói x2"
            },
            {
                id: `h${hero.id}_u2`,
                heroId: hero.id,
                reqLevel: 40,
                type: "GLOBAL_DPS_MULT",
                value: 1.1,
                costMultiplier: 50,
                icon: "📜",
                name: "Estratégia Ninja",
                desc: "DPS de todos +10%"
            },
            {
                id: `h${hero.id}_u3`,
                heroId: hero.id,
                reqLevel: 60,
                type: "SELF_DPS_MULT",
                value: 2,
                costMultiplier: 200,
                icon: "✨",
                name: `Técnica Secreta II`,
                desc: "Dano deste herói x2"
            },
            {
                id: `h${hero.id}_u4`,
                heroId: hero.id,
                reqLevel: 80,
                type: "GLOBAL_DPS_MULT",
                value: 1.2, // Buff global genérico forte
                costMultiplier: 1000,
                icon: "🛡️",
                name: "Poder Oculto",
                desc: "DPS de todos +20%"
            }
        ];
    }
});

const zoneData = {
    baseHp: 10,
    hpMultiplier: 2.05,
    coinsMultiplier: 1.5,
    monstersPerZone: 10
};

// Cada sprite tem seu próprio nome único
const enemyData = [
    { name: "Akira", img: "./static/img/enemies/enemy_main.png" },
    { name: "Kenji", img: "./static/img/enemies/enemy_v4.png" },
    { name: "Ryu", img: "./static/img/enemies/enemy_v5.png" },
    { name: "Takeshi", img: "./static/img/enemies/enemy_v6.png" }
];

// Manter compatibilidade com código antigo
const monsterNames = enemyData.map(e => e.name);
const monsterImages = enemyData.map(e => e.img);

// Imagem do Boss (aparece a cada 5 fases)
const bossImage = "./static/img/enemies/boss.png";
