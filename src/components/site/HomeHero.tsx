import Image from "next/image";
import Link from "next/link";
import styles from "./HomeHero.module.css";

export type HeroPerson = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  committee?: string;
  image: string;
  isCutout: boolean;
};

type HomeHeroProps = {
  people: HeroPerson[];
};

const personClasses = [styles.personOne, styles.personTwo, styles.personThree];

export function HomeHero({ people }: HomeHeroProps) {
  const featuredPeople = people.slice(0, 3);

  return (
    <section
      className={`${styles.root} site-home-hero`}
      data-hero
      data-site-hero
      aria-labelledby="home-hero-title"
    >
      <div className={styles.background} data-hero-bg aria-hidden="true">
        <div className={styles.backgroundInner} data-hero-bg-inner>
          <span className={styles.backgroundAxis} />
          <span className={styles.backgroundArc} />
          <span className={styles.backgroundGlow} />
        </div>
      </div>

      <div className={styles.frame}>
        <div className={styles.content} data-hero-content>
          <p className={styles.role} data-hero-role>
            <span className={styles.liveDot} aria-hidden="true" />
            IT CLUB <span aria-hidden="true">/</span> BATU
          </p>

          <h1 id="home-hero-title" className={styles.title}>
            <span className={styles.titleMask}>
              <span data-hero-title-line>Find your</span>
            </span>
            <span className={styles.titleMask}>
              <span className={styles.titleAccent} data-hero-title-line>
                people.
              </span>
            </span>
            <span className={styles.titleMask}>
              <span data-hero-title-line>Build together.</span>
            </span>
          </h1>

          <p className={styles.copy} data-hero-copy>
            Meet the published teams and explore where your curiosity fits at IT
            Club.
          </p>
          <p className={styles.arabic} lang="ar" dir="rtl" data-hero-copy>
            نتعلّم معًا، ونبني ما بعد الفكرة.
          </p>

          <div className={styles.actions} data-hero-actions>
            <Link
              href="/community"
              className={`${styles.primaryAction} site-button`}
              data-magnetic="true"
            >
              Meet the teams <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/tracks"
              className={`${styles.secondaryAction} site-button`}
              data-magnetic="true"
            >
              Explore tracks <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>

        <div
          className={styles.ensemble}
          data-hero-portrait
          data-spotlight="hero-ensemble"
          aria-label={
            featuredPeople.length
              ? "Published IT Club members"
              : "IT Club identity mark"
          }
        >
          <div className={styles.ensembleHeader} aria-hidden="true">
            <span>PEOPLE / IDEAS / PRACTICE</span>
            <span>ITC—01</span>
          </div>

          <div
            className={styles.portraitReveal}
            data-hero-portrait-reveal
            data-spotlight="hero-portraits"
          >
            <div
              className={styles.logo}
              data-hero-logo
              tabIndex={0}
              role="img"
              aria-label="IT Club logo"
            >
              <Image
                src="/logo.webp"
                alt=""
                fill
                priority
                sizes="(min-width: 821px) 42vw, 92vw"
                className={styles.logoImage}
              />
            </div>

            <div className={styles.logoRule} aria-hidden="true" />

            {featuredPeople.map((person, index) => {
              const descriptor = [person.role, person.committee]
                .filter(Boolean)
                .join(" · ");

              return (
                <Link
                  href={`/community/${person.slug}`}
                  className={`${styles.person} ${personClasses[index] ?? styles.personOne}`}
                  data-hero-person
                  data-spotlight="hero-person"
                  key={person.id}
                  aria-label={`View ${person.name}${descriptor ? `, ${descriptor}` : ""}`}
                >
                  <figure className={styles.personFigure}>
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      unoptimized
                      priority={index === 0}
                      sizes="(min-width: 1100px) 25vw, (min-width: 821px) 30vw, 46vw"
                      className={`${styles.personImage} ${person.isCutout ? styles.cutout : styles.editorial}`}
                    />
                    <figcaption className={styles.personTag}>
                      <span className={styles.personName}>{person.name}</span>
                      {descriptor ? (
                        <span className={styles.personDescriptor}>{descriptor}</span>
                      ) : null}
                    </figcaption>
                  </figure>
                </Link>
              );
            })}
          </div>

          <div className={styles.ensembleMeta} data-hero-meta>
            <span>IT CLUB / COMMUNITY</span>
            <span>BATU / ALEXANDRIA</span>
          </div>
        </div>
      </div>

      <div className={styles.footer} aria-hidden="true">
        <span>LEARN · MAKE · MOVE</span>
        <span>
          SCROLL TO EXPLORE <b>↓</b>
        </span>
      </div>

      <div className={styles.cardMark} data-hero-card aria-hidden="true" />
      <div className={styles.shade} data-hero-shade aria-hidden="true" />
    </section>
  );
}
