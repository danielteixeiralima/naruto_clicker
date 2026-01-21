const heroesData = [
    { id: 1, name: "Iruka Umino", baseCost: 10, baseDps: 1, img: "iruka.png" },
    { id: 2, name: "Mizuki", baseCost: 100, baseDps: 5, img: "mizuki.png" },
    { id: 3, name: "Konohamaru Sarutobi", baseCost: 500, baseDps: 12, img: "konohamaru.png" },
    { id: 4, name: "Ebisu", baseCost: 1000, baseDps: 25, img: "ebisu.png" },
    { id: 5, name: "Tenten", baseCost: 2500, baseDps: 50, img: "tenten.png" },
    { id: 6, name: "Ino Yamanaka", baseCost: 5000, baseDps: 80, img: "ino.png" },
    { id: 7, name: "Kiba Inuzuka", baseCost: 12000, baseDps: 150, img: "kiba.png" },
    { id: 8, name: "Shino Aburame", baseCost: 25000, baseDps: 300, img: "shino.png" },
    { id: 9, name: "Hinata Hyuga (Genin)", baseCost: 60000, baseDps: 550, img: "hinata_genin.png" },
    { id: 10, name: "Choji Akimichi", baseCost: 150000, baseDps: 1000, img: "choji.png" },
    { id: 11, name: "Shikamaru Nara", baseCost: 400000, baseDps: 2200, img: "shikamaru.png" },
    { id: 12, name: "Sakura Haruno (Genin)", baseCost: 1000000, baseDps: 4500, img: "sakura_genin.png" },
    { id: 13, name: "Sasuke Uchiha (Genin)", baseCost: 2500000, baseDps: 9000, img: "sasuke_genin.png" },
    { id: 14, name: "Naruto Uzumaki (Genin)", baseCost: 6000000, baseDps: 18000, img: "naruto_genin.png" },
    { id: 15, name: "Haku", baseCost: 15000000, baseDps: 40000, img: "haku.png" },
    { id: 16, name: "Zabuza Momochi", baseCost: 40000000, baseDps: 90000, img: "zabuza.png" },
    { id: 17, name: "Rock Lee (Portões)", baseCost: 100000000, baseDps: 200000, img: "rocklee.png" },
    { id: 18, name: "Neji Hyuga", baseCost: 300000000, baseDps: 500000, img: "neji.png" },
    { id: 19, name: "Gaara do Deserto", baseCost: 800000000, baseDps: 1200000, img: "gaara.png" },
    { id: 20, name: "Kabuto Yakushi", baseCost: 2000000000, baseDps: 3000000, img: "kabuto.png" },
    { id: 21, name: "Kimimaro", baseCost: 5000000000, baseDps: 7000000, img: "kimimaro.png" },
    { id: 22, name: "Yamato", baseCost: 12000000000, baseDps: 15000000, img: "yamato.png" },
    { id: 23, name: "Sai", baseCost: 30000000000, baseDps: 35000000, img: "sai.png" },
    { id: 24, name: "Asuma Sarutobi", baseCost: 80000000000, baseDps: 85000000, img: "asuma.png" },
    { id: 25, name: "Kakashi Hatake", baseCost: 200000000000, baseDps: 200000000, img: "kakashi.png" },
    { id: 26, name: "Might Guy (7 Portões)", baseCost: 500000000000, baseDps: 500000000, img: "guy.png" },
    { id: 27, name: "Kisame Hoshigaki", baseCost: 1500000000000, baseDps: 1200000000, img: "kisame.png" },
    { id: 28, name: "Deidara", baseCost: 4000000000000, baseDps: 3000000000, img: "deidara.png" },
    { id: 29, name: "Sasori", baseCost: 10000000000000, baseDps: 7000000000, img: "sasori.png" },
    { id: 30, name: "Kakuzu", baseCost: 25000000000000, baseDps: 15000000000, img: "kakuzu.png" },
    { id: 31, name: "Hidan", baseCost: 70000000000000, baseDps: 40000000000, img: "hidan.png" },
    { id: 32, name: "Itachi Uchiha", baseCost: 200000000000000, baseDps: 100000000000, img: "itachi.png" },
    { id: 33, name: "Jiraiya", baseCost: 600000000000000, baseDps: 300000000000, img: "jiraiya.png" },
    { id: 34, name: "Orochimaru", baseCost: 2000000000000000, baseDps: 800000000000, img: "orochimaru.png" },
    { id: 35, name: "Tsunade Senju", baseCost: 7000000000000000, baseDps: 2500000000000, img: "tsunade.png" },
    { id: 36, name: "Pain (Nagato)", baseCost: 25000000000000000, baseDps: 8000000000000, img: "pain.png" },
    { id: 37, name: "Minato Namikaze", baseCost: 100000000000000000, baseDps: 30000000000000, img: "minato.png" },
    { id: 38, name: "Hashirama Senju", baseCost: 500000000000000000, baseDps: 150000000000000, img: "hashirama.png" },
    { id: 39, name: "Madara Uchiha (Rikudou)", baseCost: 2000000000000000000, baseDps: 800000000000000, img: "madara.png" },
    { id: 40, name: "Naruto (Modo Baryon)", baseCost: 10000000000000000000, baseDps: 5000000000000000, img: "naruto_baryon.png" }
];

const zoneData = {
    baseHp: 10,
    hpMultiplier: 1.55, // HP cresce 55% por level
    coinsMultiplier: 1.5,
    monstersPerZone: 10
};

const monsterNames = [
    "Bandido", "Ninja Renegado", "Zetsu Branco", "Clone das Sombras", "Marionete", 
    "Cobra Gigante", "Sapo Gigante", "Lesma Gigante", "Corvo", "Guerreiro Susanoo"
];
