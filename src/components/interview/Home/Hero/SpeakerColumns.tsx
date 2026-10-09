import { columns } from "./hero-data";
import { SpeakerTile } from "./SpeakerTile";

export const SpeakerColumns = () => {
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-px bg-black md:grid-cols-4">
      {columns.map((column, colIndex) => {
        const isRightSide = colIndex >= 2;

        return (
          <div
            key={colIndex}
            className={`overflow-hidden ${
              colIndex > 1 ? "hidden md:block" : ""
            }`}
          >
            <div
              className={`${
                isRightSide ? "translate-y-[-8%]" : ""
              }`}
            >
              <div
                className="hero-col-up flex flex-col gap-px will-change-transform"
                style={{
                  animationDuration: "32s",
                  animationDelay: isRightSide
                    ? "-8s"
                    : "-8s",
                }}
              >
                {[...column, ...column].map((speaker, rowIndex) => (
                  <SpeakerTile
                    key={`${speaker.id || speaker.name}-col-${colIndex}-idx-${rowIndex}`}
                    speaker={speaker}
                    priority={colIndex < 2 && rowIndex === 0}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};