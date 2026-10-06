import { columns } from "./hero-data";
import { SpeakerTile } from "./SpeakerTile";

export const SpeakerColumns = () => {
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-px bg-black md:grid-cols-4">
      {columns.map((column, index) => {
        const isRightSide = index >= 2;

        return (
          <div
            key={index}
            className={`overflow-hidden ${
              index > 1 ? "hidden md:block" : ""
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
                {[...column, ...column].map(
                  (speaker, i) => (
                    <SpeakerTile
                      key={`${speaker.name}-${i}`}
                      speaker={speaker}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};