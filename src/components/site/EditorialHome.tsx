"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Code2,
  Cpu, FlaskConical, Handshake, Lightbulb, Megaphone, Plus, Share2, Users,
} from "lucide-react";
import { gsap } from "./motion/gsap";
import type { EditorialEvent, EditorialPartner, EditorialPerson, EditorialTrack } from "./editorial-types";
import styles from "./EditorialHome.module.css";

type HomeProps = {
  tracks: EditorialTrack[];
  people: EditorialPerson[];
  events: EditorialEvent[];
  eventMode: "upcoming" | "archive" | "undated";
  partners: EditorialPartner[];
  notice?: { title: string; summary?: string; href?: string };
};

const trackIcons: Record<string, typeof Users> = {
  hr: Users, pr: Megaphone, sm: Share2, oc: CalendarDays, it: Code2, rnd: FlaskConical,
};

function Chapter({ number, children }: { number: string; children: string }) {
  return <p className="site-chapter"><span>{number}</span><span>{children}</span></p>;
}

function PillLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className={styles.pill} data-magnetic>{children}<span><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" /></span></Link>;
}

function TrackCarousel({ tracks }: { tracks: EditorialTrack[] }) {
  const [index, setIndex] = useState(0);
  const catalog = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [active, ...rest] = Array.from({ length: Math.min(3, tracks.length) }, (_, offset) => tracks[(index + offset) % tracks.length]);

  useEffect(() => {
    const element = catalog.current;
    if (element) element.dataset.hydrated = "true";
    return () => { if (element) delete element.dataset.hydrated; };
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!grid.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo("[data-carousel-detail]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .045, ease: "power3.out" });
      gsap.fromTo("[data-carousel-icon]", { scale: .88, rotation: -7 }, { scale: 1, rotation: 0, duration: .8, ease: "power3.out" });
    }, grid);
    return () => context.revert();
  }, [index]);

  if (!active) return <div className={styles.empty}><Cpu size={46} strokeWidth={1.2} aria-hidden="true" /><h3>The next chapter is taking shape.</h3><p>No tracks have been published yet.</p><PillLink href="/community">Meet the community</PillLink></div>;
  const ActiveIcon = trackIcons[active.slug] || Code2;
  const move = (amount: number) => setIndex((value) => (value + amount + tracks.length) % tracks.length);

  return (
    <>
      <div className={styles.trackGrid} ref={grid} role="region" aria-label="Explore published tracks" aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      }}>
      <Link href={`/tracks#${active.slug}`} className={styles.featureCard} data-editorial-lift style={{ "--card-accent": active.color, "--card-ink": active.ink } as CSSProperties} aria-label={`Explore ${active.title}`}>
        <div className={styles.featureMeta} data-carousel-detail><span>{active.category || "Our tracks"}</span><span>{active.slug.toUpperCase()}</span></div>
        <span className={styles.featureWatermark} aria-hidden="true"><ActiveIcon size={330} strokeWidth={.7} /></span>
        <span className={styles.featureIcon} data-carousel-icon aria-hidden="true"><ActiveIcon size={115} strokeWidth={1.05} /></span>
        <div className={styles.featureBottom} data-carousel-detail>
          <div><h3>{active.title}</h3>{active.arabicTitle ? <p lang="ar" dir="rtl">{active.arabicTitle}</p> : null}</div>
          <span className={styles.roundArrow}><ArrowUpRight size={27} strokeWidth={1.4} aria-hidden="true" /></span>
        </div>
      </Link>
      <div className={styles.trackAside}>
        <div className={styles.smallCards}>
          {rest.map((track, offset) => {
            const Icon = trackIcons[track.slug] || Code2;
            return <button key={track.id} type="button" className={styles.smallCard} onClick={() => move(offset + 1)} aria-label={`Feature ${track.title}`} style={{ "--card-accent": track.color, "--card-ink": track.ink } as CSSProperties} data-editorial-lift>
              <span className={styles.smallPlus}><Plus size={17} strokeWidth={1.4} aria-hidden="true" /></span>
              <span className={styles.smallIcon} data-carousel-icon><Icon size={59} strokeWidth={1.05} aria-hidden="true" /></span>
              <h3 data-carousel-detail>{track.title}</h3>
            </button>;
          })}
        </div>
        <div className={styles.carouselControls}>
          <span className={styles.carouselStatus} aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(-1)} className={styles.previous} disabled={tracks.length < 2} aria-label="Previous track"><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" onClick={() => move(1)} className={styles.next} disabled={tracks.length < 2} aria-label="Next track"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
        <div className={styles.trackDescription} data-carousel-detail><p>{active.summary || "Different ways to contribute. A shared commitment to learning by doing."}</p><Link href={`/tracks#${active.slug}`}>Explore this track <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
      </div>
      </div>
      {tracks.length ? (
        <nav
          ref={catalog}
          className={styles.staticTrackCatalog}
          aria-label="Browse all published tracks"
        >
          {tracks.map((track, trackIndex) => (
            <Link
              key={track.id}
              href={`/tracks#${track.slug}`}
              style={{ "--catalog-accent": track.color, "--catalog-ink": track.ink } as CSSProperties}
            >
              <span>{String(trackIndex + 1).padStart(2, "0")}</span>
              <span>{track.title}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}

function PeopleCards({ people }: { people: EditorialPerson[] }) {
  const [offset, setOffset] = useState(0);
  const cards = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!cards.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => gsap.fromTo("[data-person-content]", { x: 20, opacity: 0 }, { x: 0, opacity: 1, stagger: .05, duration: .5, ease: "power3.out" }), cards);
    return () => context.revert();
  }, [offset]);
  const selected = Array.from({ length: Math.min(2, people.length) }, (_, index) => people[(offset + index) % people.length]);
  const move = (direction: number) => setOffset((value) => (value + direction * 2 + people.length) % people.length);
  return (
    <div className={styles.peopleGrid}>
      <div className={styles.peopleIntro}>
        <div className={styles.peopleSymbol} data-editorial-symbol><Users size={76} strokeWidth={1.1} aria-hidden="true" /></div>
        <div><h2 id="home-community-title">Different people.<br />Shared momentum.</h2>
          <p className={styles.peopleArabic} lang="ar" dir="rtl">الفكرة بتكبر بناسها.</p>
          <div className={styles.peopleControls}>
            <button type="button" className={styles.previous} onClick={() => move(-1)} disabled={people.length < 3} aria-label="Previous community profiles"><ArrowLeft size={18} aria-hidden="true" /></button>
            <button type="button" className={styles.next} onClick={() => move(1)} disabled={people.length < 3} aria-label="Next community profiles"><ArrowRight size={18} aria-hidden="true" /></button>
            <span className={styles.profileCount} aria-live="polite">{people.length ? `${offset + 1}–${((offset + selected.length - 1) % people.length) + 1} / ${people.length}` : "No profiles yet"}</span>
          </div>
        </div>
      </div>
      <div className={styles.peopleCards} ref={cards}>
        {selected.map((person) => <Link key={person.id} href={`/community/${person.slug}`} className={styles.personCard} data-editorial-reveal aria-label={`Meet ${person.name}`}>
          <div className={styles.personTop} data-person-content><span><Users size={16} strokeWidth={1.4} aria-hidden="true" />{person.committee || "Community"}</span><span className={styles.personSymbol}><Lightbulb size={29} strokeWidth={1.1} aria-hidden="true" /></span></div>
          <div className={styles.personScope} data-person-content><span className={styles.scopeIcon}><ArrowUpRight size={26} strokeWidth={1.6} aria-hidden="true" /></span><small>Published team scope</small><p>{person.scope}</p></div>
          <div className={styles.personBottom} data-person-content><h3>{person.name}</h3><p>{person.role}</p><span>View profile <ArrowUpRight size={12} aria-hidden="true" /></span></div>
        </Link>)}
        {!selected.length ? <div className={styles.empty}><h3>The people make the difference.</h3><p>The published directory is being prepared.</p><PillLink href="/community">Explore the community</PillLink></div> : null}
      </div>
    </div>
  );
}

export function EditorialHome({ tracks, people, events, eventMode, partners, notice }: HomeProps) {
  return (
    <>
      {notice ? <aside className={styles.notice} aria-label="Current club notice"><span>Club notice</span><p><strong>{notice.title}</strong>{notice.summary ? ` — ${notice.summary}` : ""}</p>{notice.href ? <a href={notice.href}>Read more <ArrowUpRight size={15} aria-hidden="true" /></a> : null}</aside> : null}
      <section className={styles.about} id="about" aria-labelledby="about-title" data-editorial-about>
        <div className={styles.sectionTop}><Chapter number="01">About</Chapter><Link className={styles.quietLink} href="/community">Meet the people <ArrowUpRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link></div>
        <div className={styles.aboutStatement}>
          <div className={styles.aboutTile} data-editorial-symbol aria-hidden="true"><Cpu size={76} strokeWidth={1} /></div>
          <h2 id="about-title">We are a student-led <span className={styles.inlineIcon}><Code2 size={30} strokeWidth={1.5} aria-hidden="true" /></span> technology community at <span className={styles.inlinePill}>BATU</span>, making room for curious minds and different starting points. From sharing knowledge <span className={styles.inlineIcon}><BookOpen size={29} strokeWidth={1.4} aria-hidden="true" /></span> to building useful ideas, we create the space to <span className={styles.aboutAccent} data-editorial-accent>learn together, practice with purpose, and move ideas forward.</span></h2>
          <p className={styles.aboutArabic} lang="ar" dir="rtl">نتعلّم معًا، ونبني ما بعد الفكرة.</p>
        </div>
        <div className={styles.aboutSeal} aria-hidden="true"><span /><div data-editorial-symbol><Cpu size={28} strokeWidth={1.15} /></div><span /></div>
      </section>

      <section className={styles.tracks} id="tracks" aria-labelledby="home-tracks-title" data-editorial-tracks>
        <div className={styles.splitTop}><Chapter number="02">Our tracks</Chapter><h2 id="home-tracks-title" data-editorial-reveal>Different ways to learn.<br />One place to belong.</h2></div>
        <TrackCarousel tracks={tracks} />
      </section>

      <section className={styles.events} aria-labelledby="home-events-title">
        <Chapter number="03">Events</Chapter>
        <div className={styles.eventsGrid}>
          <div className={styles.eventsIntro} data-editorial-reveal>
            <h2 id="home-events-title"><span>Ideas, in action.</span><br />{eventMode === "upcoming" ? "What’s coming up." : eventMode === "archive" ? "From the club archive." : "Around the club."}</h2>
            <p>{eventMode === "upcoming" ? "Published dates and details, so you know where to find us next." : eventMode === "archive" ? "A look at our published past events. New dates appear here when they are announced." : "Published events and sessions from the community. Dates appear when confirmed."}</p>
            <div className={styles.eventLandscape} aria-hidden="true" data-editorial-symbol><CalendarDays size={110} strokeWidth={.85} /><span>LEARN / CONNECT / MAKE</span></div>
          </div>
          <div className={styles.eventList}>
            {events.map((event, index) => <article key={event.id} className={`${styles.eventRow} ${index === 0 ? styles.eventExpanded : ""}`} data-editorial-reveal>
              <span className={styles.eventNumber}>{String(index + 1).padStart(2, "0")}.</span>
              <div><h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>{index === 0 ? <><p className={styles.eventDate}>{event.date}</p>{event.summary ? <p className={styles.eventSummary}>{event.summary}</p> : null}<Link href={`/events/${event.slug}`} className={styles.detailLink}>View details <ArrowUpRight size={13} aria-hidden="true" /></Link></> : null}</div>
              <Link href={`/events/${event.slug}`} className={index === 0 ? styles.eventThumbnail : styles.eventArrow} aria-label={`View ${event.title}`}><CalendarDays size={index === 0 ? 52 : 16} strokeWidth={1.1} aria-hidden="true" />{index !== 0 ? <ArrowUpRight size={17} aria-hidden="true" /> : null}</Link>
            </article>)}
            {!events.length ? <div className={styles.eventEmpty}><CalendarDays size={39} strokeWidth={1.2} aria-hidden="true" /><h3>Something worth showing up for.</h3><p>No event listing has been published yet. Follow the events page for confirmed updates.</p></div> : null}
            <div className={styles.eventCta}><PillLink href="/events">All events</PillLink></div>
          </div>
        </div>
      </section>

      <section className={styles.community} aria-labelledby="home-community-title">
        <Chapter number="04">Community</Chapter>
        <PeopleCards people={people} />
        <div className={styles.partners}>
          {partners.length ? <><span>In good company</span>{partners.slice(0, 4).map((partner) => <a key={partner.id} href={partner.href || "/sponsors"}><Handshake size={16} strokeWidth={1.2} aria-hidden="true" />{partner.name}</a>)}</> : <span>Good ideas grow with good company.</span>}
          <Link href="/sponsors">Our partners <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.joinScene} aria-labelledby="home-join-title" data-editorial-join>
        <div className={styles.joinChapter}><Chapter number="05">Find your place</Chapter></div>
        <div className={styles.joinBackdrop} aria-hidden="true" data-editorial-join-art><Cpu size={640} strokeWidth={.55} /><span><Code2 size={320} strokeWidth={.7} /></span></div>
        <div className={styles.joinPanel} data-editorial-join-panel>
          <h2 id="home-join-title">Find your people and<br />give your <span className={styles.inlineIcon}><Lightbulb size={29} strokeWidth={1.3} aria-hidden="true" /></span> curiosity<br />somewhere to go.</h2>
          <div className={styles.joinCopy}><Link href="/tracks">Explore our tracks <ArrowUpRight size={14} aria-hidden="true" /></Link><p>Discover the teams, meet the people, and see where your next idea could begin.</p><span lang="ar" dir="rtl">فكرتك الجاية مش لازم تبدأ لوحدك.</span></div>
          <Link href="/community" className={styles.joinTile} aria-label="Meet the IT Club community" data-editorial-symbol><Users size={65} strokeWidth={1.05} aria-hidden="true" /><ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}
