import Link from "next/link";
import { ArrowDown, ArrowUpRight, Code2, Lightbulb, Users } from "lucide-react";
import { HeroVideo } from "./HeroVideo";
import styles from "./HomeHero.module.css";

export type HeroPerson = {
  id: string;
  slug: string;
  name: string;
  role?: string;
};

export function HomeHero({ people }: { people: HeroPerson[] }) {
  const icons = [Users, Code2, Lightbulb];
  return (
    <section className={styles.root} data-editorial-hero aria-labelledby="home-hero-title">
      <div className={styles.film} data-editorial-film>
        <HeroVideo />
      </div>
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.support} data-editorial-hero-support>
        <div className={styles.miniPeople} aria-label="Meet our published community">
          {people.slice(0, 3).map((person, index) => {
            const Icon = icons[index];
            return (
              <Link key={person.id} href={`/community/${person.slug}`} aria-label={`Meet ${person.name}${person.role ? `, ${person.role}` : ""}`}>
                <Icon size={23} strokeWidth={1.3} aria-hidden="true" />
              </Link>
            );
          })}
          {!people.length ? <span><Users size={23} aria-hidden="true" /></span> : null}
        </div>
        <p>A student-led community for curious minds.<br />We learn, share ideas, and build together<br />at Borg Al Arab Technological University.</p>
        <span className={styles.supportArabic} lang="ar" dir="rtl">الفضول بداية. والفريق يكمل.</span>
      </div>
      <div className={styles.bottom}>
        <div className={styles.headline}>
          <h1 id="home-hero-title" className={styles.title}>
            <span className={styles.mask}><span data-editorial-hero-line>Curiosity deserves</span></span>
            <span className={styles.mask}><span data-editorial-hero-line>a community.</span></span>
            <span className={styles.lastLine}>
              <span className={styles.mask}><span data-editorial-hero-line>Find yours.</span></span>
              <Link href="/community" className={styles.join} data-magnetic data-editorial-hero-action>
                Meet us <span><ArrowUpRight size={22} strokeWidth={1.6} aria-hidden="true" /></span>
              </Link>
            </span>
          </h1>
        </div>
        <a className={styles.scroll} href="#about">Scroll down <ArrowDown size={15} aria-hidden="true" /></a>
      </div>
      <span className={styles.filmNote}>IT CLUB / BATU <span>Ideas in motion.</span></span>
    </section>
  );
}
