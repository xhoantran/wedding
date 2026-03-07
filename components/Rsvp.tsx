"use client";

import { useActionState, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitRsvp, RsvpState } from "@/app/[locale]/actions/rsvp";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import { useWeddingStore } from "@/lib/store";
import { useGuest, getGuestDisplayName } from "@/lib/guest-context";
import SectionHeading from "./SectionHeading";
import ScrollReveal from "./ScrollReveal";
import MagneticButton from "./MagneticButton";

const initialState: RsvpState = { success: false };

export default function Rsvp({ locale }: { locale: Locale }) {
  const [state, formAction, isPending] = useActionState(
    submitRsvp,
    initialState
  );
  const [attendance, setAttendance] = useState<string>("");
  const setHasRsvped = useWeddingStore((s) => s.setHasRsvped);
  const { guest, inviteId } = useGuest();

  useEffect(() => {
    if (state.success) setHasRsvped();
  }, [state.success, setHasRsvped]);
  const t = getTranslations(locale).rsvp;

  return (
    <section id="rsvp" className="section-curve-top bg-champagne py-20 md:py-32">
      <div className="mx-auto max-w-xl px-6 md:px-12">
        {/* Envelope icon */}
        <motion.svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="mx-auto mb-6 text-gold"
          initial={{ y: 15, opacity: 0, scale: 0.8 }}
          whileInView={{ y: 0, opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect x="6" y="12" width="36" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 14L24 28L42 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <motion.path
            d="M24 28L24 20"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />
          <motion.path
            d="M20 24L24 20L28 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />
        </motion.svg>

        <SectionHeading title={t.title} subtitle={t.subtitle} />

        <AnimatePresence mode="wait">
          {state.success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-center"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
                className="inline-block text-5xl"
              >
                &#x2665;
              </motion.span>
              <h3 className="mt-4 font-serif text-3xl font-light text-charcoal">
                {t.thankYou}
              </h3>
              <p className="mt-3 text-sm text-stone">{t.thankYouMessage}</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              action={formAction}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ScrollReveal>
                <div className="space-y-6">
                  {inviteId && (
                    <input type="hidden" name="inviteId" value={inviteId} />
                  )}

                  {/* Name */}
                  <div className="input-underline">
                    <input
                      type="text"
                      name="name"
                      placeholder={t.name}
                      defaultValue={guest ? getGuestDisplayName(guest, locale) : ""}
                      required
                      className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
                    />
                  </div>

                  {/* Email */}
                  <div className="input-underline">
                    <input
                      type="email"
                      name="email"
                      placeholder={t.email}
                      required
                      className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
                    />
                  </div>

                  {/* Attendance */}
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone">
                      {t.attending}
                    </p>
                    <div className="flex gap-4">
                      <label
                        className={`flex-1 cursor-pointer rounded-full border-2 py-3 text-center text-sm transition-all duration-300 ${
                          attendance === "accept"
                            ? "border-gold bg-gold text-white shadow-md"
                            : "border-rose/30 text-stone hover:border-gold/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="attendance"
                          value="accept"
                          required
                          className="sr-only"
                          onChange={() => setAttendance("accept")}
                        />
                        {t.accept}
                      </label>
                      <label
                        className={`flex-1 cursor-pointer rounded-full border-2 py-3 text-center text-sm transition-all duration-300 ${
                          attendance === "decline"
                            ? "border-gold bg-gold text-white shadow-md"
                            : "border-rose/30 text-stone hover:border-gold/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="attendance"
                          value="decline"
                          required
                          className="sr-only"
                          onChange={() => setAttendance("decline")}
                        />
                        {t.decline}
                      </label>
                    </div>
                  </div>

                  {/* Conditional fields */}
                  <AnimatePresence>
                    {attendance === "accept" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="space-y-6 overflow-hidden"
                      >
                        <div className="input-underline">
                          <input
                            type="number"
                            name="guests"
                            min="1"
                            max="5"
                            defaultValue="1"
                            placeholder={t.guests}
                            className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
                          />
                        </div>

                        <div className="input-underline">
                          <select
                            name="meal"
                            className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none"
                          >
                            <option value="">{t.meal}</option>
                            <option value="standard">{t.mealStandard}</option>
                            <option value="vegetarian">{t.mealVegetarian}</option>
                            <option value="vegan">{t.mealVegan}</option>
                            <option value="other">{t.mealOther}</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message */}
                  <div className="input-underline">
                    <textarea
                      name="message"
                      placeholder={t.message}
                      rows={3}
                      className="w-full resize-none border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
                    />
                  </div>

                  {/* Error */}
                  {state.error && (
                    <p className="text-sm text-red-500">{state.error}</p>
                  )}

                  {/* Submit */}
                  <div className="pt-4 text-center">
                    <MagneticButton className="inline-block">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-full bg-gold px-12 py-4 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-gold-light hover:shadow-lg disabled:opacity-50"
                      >
                        {isPending ? t.sending : t.send}
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </ScrollReveal>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
