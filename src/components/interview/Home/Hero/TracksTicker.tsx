import { tracks } from "./hero-data";

const TrackItem = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => {
  return (
    <span className="flex shrink-0 items-center gap-2 pr-12 text-xs text-white/80">
      <span
        className={`h-1.5 w-1.5 rounded-full ${color}`}
      />

      {label}
    </span>
  );
};

export const TracksTicker = () => {
  return (
    <div className="absolute bottom-0 left-0 z-10 flex h-12 w-full items-center overflow-hidden border-t border-white/10 bg-black/70 backdrop-blur-sm">
      <div className="hero-ticker flex w-max whitespace-nowrap">
        {[0, 1, 2, 3].flatMap((group) =>
          tracks.map((track, index) => (
            <TrackItem
              key={`${group}-${index}`}
              label={track.label}
              color={track.color}
            />
          )),
        )}
      </div>
    </div>
  );
};