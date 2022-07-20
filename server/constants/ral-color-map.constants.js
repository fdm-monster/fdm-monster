const dutchColorRALMap = {
  naturel: {
    RAL: 9010,
    alts: ["natural"]
  }, // Transparent, so remapped to cream white
  lichtgrijs: {
    RAL: 7035,
    alts: ["lichtgray"]
  },
  zilver: {
    // Blank aluminiumkleurig
    RAL: 9006,
    alts: ["silver"]
  },
  ijzergrijs: {
    RAL: 7011,
    alts: ["irongray"]
  },
  zwart: {
    // Verkeerszwart
    RAL: 9017,
    alts: ["black"]
  },
  rood: {
    // Verkeersrood
    RAL: 3020,
    alts: ["red"]
  },
  oranje: {
    // Licht roodoranje
    RAL: 2008,
    alts: ["orange"]
  },
  geelgoud: {
    RAL: 1004,
    alts: ["yellowgold"]
  },
  geel: {
    // Verkeersgeel
    RAL: 1023,
    alts: ["yellow"]
  },
  zwavelgeel: {
    RAL: 1016,
    alts: ["sulfuryellow"]
  },
  lichtgroen: {
    RAL: 6027,
    alts: ["pastelgroen", "lightgreen", "pastelgreen"]
  },
  groen: {
    // appelgroen => geelgroen
    RAL: 6027,
    alts: ["appelgroen", "green", "applegreen"]
  },
  loofgroen: {
    RAL: 6002
  },
  donkergroen: {
    // Turkooisgroen
    RAL: 6016,
    alts: ["darkgreen", "turquoisegreen"]
  },
  donkerblauw: {
    // Ultramarijn blauw
    RAL: 5002,
    alts: ["darkblue", "ultramarineblue"]
  },
  middenblauw: {
    // Signaalblauw
    RAL: 5005,
    alts: ["signalblue"]
  },
  blauw: {
    // Blauw => Hemelsblauw
    RAL: 5002,
    alts: ["hemelsblauw", "hemelblauw", "skyblue", "blue"]
  },
  paars: {
    // Blauwlila
    RAL: 4005,
    alts: ["purple"]
  },
  magenta: {
    // telemagenta
    RAL: 4010
  },
  roze: {
    // Roze => Heidepaars
    RAL: 4003,
    alts: ["roze fluor", "rozefluor", "pink", "pinkfluor", "heatherviolet"]
  },
  pastelroze: {
    // Lichtroze
    RAL: 3015,
    alts: ["lichtroze", "pastelpink", "lightpink"]
  },
  bruin: {
    // mahoniebruin
    RAL: 8016,
    alts: ["brown"]
  },
  bronsgoud: {
    // Parelmoer goud
    RAL: 1036,
    alts: ["gold", "goud", "bronzegold", "pearlrubyred"]
  },
  pastelblauw: {
    RAL: 5024,
    alts: ["pastelblue"]
  },
  matzwart: {
    // Zwartgrijs
    RAL: 7021,
    alts: ["mattblack", "matblack", "mattzwart"]
  },
  matwit: {
    RAL: 9002,
    alts: ["mattwhite", "matwhite"]
  },
  wit: {
    // signaalwit
    RAL: 9003,
    alts: ["gebrokenwit", "white", "signalwhite", "brokenwhite"]
  },
  grijs: {
    RAL: 7006,
    alts: ["gray"]
  }
};

const flattenedDutchRALMap = Object.entries(dutchColorRALMap).flatMap((m) => {
  const ral = m[1].RAL;
  const alts = m[1].alts?.map((a) => ({ [a]: ral }));
  const data = [
    {
      [m[0]]: ral
    },
    ...(alts ? alts : [])
  ];

  return data;
});

function findColorRAL(color) {
  if (!color?.length) return {};

  const colorFound = findMappedColorRAL(color);

  if (!colorFound) {
    return {
      color
    };
  }

  return {
    color,
    RAL: colorFound[1].RAL
  };
}

function findMappedColorRAL(color) {
  const trimmedColor = color.replace(/ /g, "")?.toLowerCase();
  return Object.entries(dutchColorRALMap).find((c) => {
    const key = c[0];
    const alts = c[1]?.alts;
    return key === trimmedColor || (!!alts && alts?.includes(trimmedColor));
  });
}

module.exports = {
  dutchColorRALMap,
  findMappedColorRAL,
  flattenedDutchRALMap,
  findColorRAL
};
