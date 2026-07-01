export type PlaylistTrack = {
  title: string;
  artist?: string;
  src: string;
  artworkUrl?: string;
};

export const PLAYLIST: PlaylistTrack[] = [
  {
    title: "Sonreir",
    artist: "Kurt",
    src: "/music/Kurt%20-%20Sonreir.mp3",
    artworkUrl:
      "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e024d9d3dcc550da95fd39c61d2",
  },
  {
    title: "Eres Mi Sol",
    artist: "Jesse & Joy",
    src: "/music/Jesse%20%26%20Joy%20-%20Eres%20Mi%20Sol.mp3",
    artworkUrl:
      "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0256f41de4b571bc3d820c9f81",
  },
  {
    title: "Punto Y Aparte",
    artist: "Jesse & Joy",
    src: "/music/Jesse%20%26%20Joy%20-%20Punto%20Y%20Aparte.mp3",
    artworkUrl:
      "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02f36391359bf91a0611815bb8",
  },
  {
    title: "Por Ti",
    artist: "Natalino",
    src: "/music/Natalino%20-%20Por%20Ti%20.mp3",
    artworkUrl:
      "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02da99822502f18800bae81251",
  },
  {
    title: "Una y Mil Veces",
    artist: "Natalino",
    src: "/music/Natalino%20-%20Una%20y%20Mil%20Veces.mp3",
    artworkUrl:
      "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c82087ad9580d828b8807c1d",
  },
];
