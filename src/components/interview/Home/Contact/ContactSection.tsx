import { ArrowUpRight } from "lucide-react";

const inputClass =
  "w-full rounded-none border-0 border-b border-white/10 bg-transparent px-0 py-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#42e895] autofill:bg-transparent autofill:text-white";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="w-full overflow-hidden bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-342.5 px-6 py-24 md:px-10 md:py-32 lg:px-0 lg:py-36">
        {/* Section heading */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.16em] text-[#8d8cff]">
            06
          </span>

          <span className="text-[11px] font-bold tracking-[0.16em] text-white/80">
            CONTACT
          </span>

          <span className="arabic text-base text-white/35">
            تواصل معنا
          </span>
        </div>

        {/* Main content */}
        <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-28">
          {/* Intro */}
          <div className="max-w-125">
            <p className="font-mono text-[9px] tracking-[0.2em] text-[#42e895]">
              LET&apos;S TALK
            </p>

            <h2 className="mt-6 text-[50px] font-bold leading-[0.9] tracking-[-0.055em] md:text-[68px] lg:text-[82px]">
              Start a
              <br />
              <span className="text-[#42e895]">conversation.</span>
            </h2>

            <p className="mt-8 max-w-115 text-[16px] leading-[1.75] text-[#9ca3aa] md:text-[17px]">
              Have a question, an idea, a partnership proposal, or something
              you want to discuss with IT Club? Send us a message and our team
              will get back to you.
            </p>

            <p className="arabic mt-5 max-w-115 text-[15px] leading-[1.9] text-white/30">
              لديك سؤال أو فكرة أو مقترح للتعاون؟ أرسل لنا رسالتك وسيتواصل
              معك فريقنا.
            </p>

            {/* Direct email */}
            <div className="mt-10">
              <p className="font-mono text-[9px] tracking-[0.18em] text-white/25">
                OR EMAIL US DIRECTLY
              </p>

              <a
                href="mailto:contact@itclub.one"
                className="mt-2 inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-[#42e895]"
              >
                contact@itclub.one

                <ArrowUpRight
                  size={14}
                  strokeWidth={1.7}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:pt-1">
            <form autoComplete="off">
              {/* Name + Email */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="font-mono text-[9px] tracking-[0.18em] text-white/30"
                  >
                    NAME
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="font-mono text-[9px] tracking-[0.18em] text-white/30"
                  >
                    EMAIL
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="mt-9">
                <label
                  htmlFor="contact-subject"
                  className="font-mono text-[9px] tracking-[0.18em] text-white/30"
                >
                  SUBJECT
                </label>

                <select
                  id="contact-subject"
                  name="subject"
                  defaultValue=""
                  required
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" disabled className="bg-[#050708]">
                    What would you like to talk about?
                  </option>

                  <option value="general" className="bg-[#050708]">
                    General inquiry
                  </option>

                  <option value="partnership" className="bg-[#050708]">
                    Partnership
                  </option>

                  <option value="collaboration" className="bg-[#050708]">
                    Collaboration
                  </option>

                  <option value="sponsorship" className="bg-[#050708]">
                    Sponsorship
                  </option>

                  <option value="other" className="bg-[#050708]">
                    Other
                  </option>
                </select>
              </div>

              {/* Message */}
              <div className="mt-9">
                <label
                  htmlFor="contact-message"
                  className="font-mono text-[9px] tracking-[0.18em] text-white/30"
                >
                  MESSAGE
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Tell us what you have in mind..."
                  rows={5}
                  required
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Action */}
              <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-75 text-[11px] leading-[1.7] text-white/25">
                  We&apos;ll use your information only to respond to your
                  message.
                </p>

                <button
                  type="submit"
                  className="group inline-flex h-13 items-center justify-center gap-3 bg-[#42e895] px-7 text-[10px] font-bold tracking-[0.16em] text-[#050708] transition-all duration-300 hover:bg-white"
                >
                  SEND MESSAGE

                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.8}
                    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-24 flex items-center gap-5">
          <span className="font-mono text-[9px] tracking-[0.18em] text-white/15">
            IT CLUB
          </span>

          <div className="h-px flex-1 bg-white/5" />

          <span className="arabic text-xs text-white/20">
            نتطلع للتواصل معك
          </span>
        </div>
      </div>
    </section>
  );
}