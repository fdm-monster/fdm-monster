const dutchColorRALMap = {
  naturel: {
    RAL: 9010
  }, // Transparent, so remapped to cream white
  lichtgrijs: {
    RAL: 7035
  },
  zilver: {
    // Blank aluminiumkleurig
    RAL: 9006
  },
  ijzergrijs: {
    RAL: 7011
  },
  zwart: {
    // Verkeerszwart
    RAL: 9017
  },
  rood: {
    // Verkeersrood
    RAL: 3020
  },
  oranje: {
    // Licht roodoranje
    RAL: 2008
  },
  geelgoud: {
    RAL: 1004
  },
  geel: {
    // Verkeersgeel
    RAL: 1023
  },
  zwavelgeel: {
    RAL: 1016
  },
  lichtgroen: {
    RAL: 6027,
    alts: ["pastelgroen"]
  },
  groen: {
    // appelgroen => geelgroen
    RAL: 6027,
    alts: ["appelgroen"]
  },
  loofgroen: {
    RAL: 6002
  },
  donkergroen: {
    // Turkooisgroen
    RAL: 6016
  },
  donkerblauw: {
    // Ultramarijn blauw
    RAL: 5002
  },
  middenblauw: {
    // Signaalblauw
    RAL: 5005
  },
  blauw: {
    // Blauw => Hemelsblauw
    RAL: 5002,
    alts: ["hemelsblauw", "hemelblauw"]
  },
  paars: {
    // Blauwlila
    RAL: 4005
  },
  magenta: {
    // telemagenta
    RAL: 4010
  },
  roze: {
    // Roze => Heidepaars
    RAL: 4003,
    alts: ["roze fluor", "rozefluor"]
  },
  pastelroze: {
    // Lichtroze
    RAL: 3015,
    alts: ["lichtroze"]
  },
  bruin: {
    // mahoniebruin
    RAL: 8016
  },
  bronsgoud: {
    // Parelmoer goud
    RAL: 1036
  },
  pastelblauw: {
    RAL: 5024
  },
  matzwart: {
    // Zwartgrijs
    RAL: 7021
  },
  matwit: {
    RAL: 9002
  },
  wit: {
    // signaalwit
    RAL: 9003,
    alts: ["gebrokenwit"]
  },
  grijs: {
    RAL: 7006
  }
};

function findColorRAL(color) {
  if (!color?.length) return {};

  const trimmedColor = color.replace(/ /g, "")?.toLowerCase();
  const colorFound = Object.entries(dutchColorRALMap).find((c) => {
    const key = c[0];
    const alts = c[1]?.alts;
    return key === trimmedColor || (!!alts && alts?.includes(trimmedColor));
  });

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

module.exports = {
  dutchColorRALMap,
  findColorRAL
};
