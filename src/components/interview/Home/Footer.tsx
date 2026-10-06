import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
} from "react-icons/fa6";

const eventLinks = [
  {
    label: "About IT Club",
    href: "#about",
  },
  {
    label: "Our Tracks",
    href: "#tracks",
  },
  {
    label: "The Interview",
    href: "#interview",
  },
  {
    label: "The Heads",
    href: "#heads",
  },
  {
    label: "Sponsors & Partners",
    href: "#sponsors",
  },
];

const trackLinks = [
  {
    label: "Human Resources",
    href: "/tracks#hr",
  },
  {
    label: "Student Relations",
    href: "/tracks#sr",
  },
  {
    label: "Social Media",
    href: "/tracks#sm",
  },
  {
    label: "Organizing Committee",
    href: "/tracks#oc",
  },
  {
    label: "Information Technology",
    href: "/tracks#it",
  },
  {
    label: "Research & Development",
    href: "/tracks#rnd",
  },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/itclub-1/",
    icon: FaLinkedinIn,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100092738074559",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/information.technology_club",
    icon: FaInstagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@information.techn92",
    icon: FaTiktok,
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050708] text-white">
      <div className="mx-auto w-full max-w-342.5 px-6 md:px-10 lg:px-0">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-16 py-20 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr] lg:gap-24 lg:py-24">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-block text-[25px] font-black leading-none tracking-[-0.04em]"
            >
              IT
              <span className="text-[#42e895]"> CLUB</span>
            </Link>

            <p className="mt-7 max-w-75 text-[15px] leading-[1.7] text-[#8f969d]">
              A student-driven technology community built for people who want
              to learn, build, experiment, and grow together.
            </p>

            <p className="arabic mt-5 max-w-75 text-[15px] leading-[1.8] text-[#737a82]">
              مجتمع تقني طلابي للأشخاص الذين يريدون التعلم والبناء والتجربة
              والتطور معًا.
            </p>

            {/* Email */}
            <a
              href="mailto:contact@itclub.one"
              className="mt-6 inline-block text-[14px] text-[#42e895] underline decoration-[#42e895]/30 underline-offset-4 transition-colors hover:text-white"
            >
              contact@itclub.one
            </a>

            {/* Social */}
            <div className="mt-7 flex items-center gap-5">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-white/40 transition-colors duration-300 hover:text-[#42e895]"
                  >
                    <Icon size={17} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-white/30">
              EXPLORE
            </p>

            <nav className="mt-6 flex flex-col items-start gap-4">
              {eventLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[14px] text-[#9ca3aa] transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Tracks */}
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-white/30">
              TRACKS
            </p>

            <nav className="mt-6 flex flex-col items-start gap-4">
              {trackLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-2 text-[14px] text-[#9ca3aa] transition-colors hover:text-white"
                >
                  {link.label}

                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.8}
                    className="opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col gap-6 border-t border-white/10 py-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[10px] tracking-[0.16em] text-white/30">
            © 2026 IT CLUB · ALL RIGHTS RESERVED
          </p>

          <div className="flex items-center gap-7">
            <Link
              href="/privacy"
              className="font-mono text-[10px] tracking-[0.16em] text-white/30 transition-colors hover:text-white"
            >
              PRIVACY
            </Link>

            <Link
              href="/terms"
              className="font-mono text-[10px] tracking-[0.16em] text-white/30 transition-colors hover:text-white"
            >
              TERMS
            </Link>
          </div>

          {/* Powered By */}
          <a
            href="https://seifdev.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40 transition-colors hover:text-white"
          >
            POWERED BY

            <span className="font-bold text-white/70 transition-colors group-hover:text-[#42e895]">
              THESEIFDEV
            </span>

            <ArrowUpRight
              size={13}
              strokeWidth={1.8}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}