// hard coded wvwteams
const wvwTeams = {
    11001: "Moogooloo",
    11002: "Rall's Rest",
    11003: "Domain of Torment",
    11004: "Yohlon Haven",
    11005: "Tombs of Drascir",
    11006: "Hall of Judgment",
    11007: "Throne of Balthazar",
    11008: "Dwayna's Temple",
    11009: "Abaddon's Prison",
    11010: "Cathedral of Blood",
    11011: "Lutgardis Conservatory",
    11012: "Mosswood",
    12001: "Skrittsburgh",
    12002: "Fortune's Vale",
    12003: "Silent Woods",
    12004: "Ettin's Back",
    12005: "Domain of Anguish",
    12006: "Palawadan",
    12007: "Bloodstone Gulch",
    12008: "Frost Citadel",
    12009: "Dragrimmar",
    12010: "Grenth's Door",
    12011: "Mirror of Lyssa",
    12012: "Melandru's Dome",
    12013: "Kormir's Library",
    12014: "Great House Aviary",
    12015: "Bava Nisos",
  };

  async function getCurrentTeam(id) {
    return wvwTeams[id];
  }

  module.exports = { getCurrentTeam };