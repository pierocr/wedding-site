export const SpotifyEmbed = ({ url, title }: { url: string; title?: string }) => {
  const embed = url.replace("open.spotify.com/", "open.spotify.com/embed/");
  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {title ? (
        <div className="px-4 pt-4 text-sm font-medium">{title}</div>
      ) : null}
      <div className="p-4 pt-2">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl">
          <iframe
            title={title ?? "Spotify"}
            src={embed}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
