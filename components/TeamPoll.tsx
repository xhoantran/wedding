"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import { WEDDING } from "@/lib/constants";
import SectionHeading from "./SectionHeading";
import ScrollReveal from "./ScrollReveal";

interface PollQuestion {
  id: string;
  text: string;
}

type VoteCounts = Record<string, { groom: number; bride: number }>;

const QUESTIONS: Record<Locale, PollQuestion[]> = {
  en: [
    { id: "cook", text: "Who's the better cook?" },
    { id: "love_first", text: "Who said 'I love you' first?" },
    { id: "romantic", text: "Who is more romantic?" },
    { id: "cry", text: "Who will cry at the wedding?" },
    { id: "early_bird", text: "Who is the early bird?" },
  ],
  vi: [
    { id: "cook", text: "Ai nấu ăn ngon hơn?" },
    { id: "love_first", text: "Ai tỏ tình trước?" },
    { id: "romantic", text: "Ai lãng mạn hơn?" },
    { id: "cry", text: "Ai sẽ khóc trong đám cưới?" },
    { id: "early_bird", text: "Ai dậy sớm hơn?" },
  ],
};

export default function TeamPoll({ locale }: { locale: Locale }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<VoteCounts>({});
  const [direction, setDirection] = useState(1);

  const t = getTranslations(locale).teamPoll;
  const questions = QUESTIONS[locale];
  const q = questions[currentQ];

  // Fetch existing vote counts
  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase
        .from("poll_votes")
        .select("question_id, vote");

      if (!data) return;

      const result: VoteCounts = {};
      for (const row of data) {
        if (!result[row.question_id]) {
          result[row.question_id] = { groom: 0, bride: 0 };
        }
        if (row.vote === "groom") result[row.question_id].groom++;
        else result[row.question_id].bride++;
      }
      setCounts(result);
    }
    fetchCounts();
  }, []);

  const handleVote = useCallback(
    async (vote: "groom" | "bride") => {
      if (voted.has(q.id)) return;

      // Optimistic update
      setVoted((prev) => new Set(prev).add(q.id));
      setCounts((prev) => {
        const existing = prev[q.id] || { groom: 0, bride: 0 };
        return {
          ...prev,
          [q.id]: {
            ...existing,
            [vote]: existing[vote] + 1,
          },
        };
      });

      // Insert to Supabase
      await supabase
        .from("poll_votes")
        .insert({ question_id: q.id, vote });

      // Auto-advance after delay
      if (currentQ < questions.length - 1) {
        setTimeout(() => {
          setDirection(1);
          setCurrentQ((prev) => prev + 1);
        }, 1500);
      }
    },
    [voted, q.id, currentQ, questions.length]
  );

  const goTo = useCallback(
    (idx: number) => {
      setDirection(idx > currentQ ? 1 : -1);
      setCurrentQ(idx);
    },
    [currentQ]
  );

  const hasVoted = voted.has(q.id);
  const qCounts = counts[q.id] || { groom: 0, bride: 0 };
  const total = qCounts.groom + qCounts.bride;
  const groomPct = total > 0 ? Math.round((qCounts.groom / total) * 100) : 50;
  const bridePct = total > 0 ? 100 - groomPct : 50;

  return (
    <section className="bg-cream py-20 md:py-32">
      <div className="mx-auto max-w-xl px-6 md:px-12">
        <ScrollReveal>
          <SectionHeading title={t.title} subtitle={t.subtitle} />
        </ScrollReveal>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Question */}
            <h3 className="mb-8 text-center font-serif text-2xl font-light text-charcoal md:text-3xl">
              {q.text}
            </h3>

            {/* Vote buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleVote("groom")}
                disabled={hasVoted}
                className={`flex-1 rounded-2xl border-2 py-6 text-center transition-all duration-300 ${
                  hasVoted
                    ? "cursor-default border-gold/30 bg-gold/5"
                    : "cursor-pointer border-gold/40 hover:border-gold hover:bg-gold/10 hover:shadow-md active:scale-[0.98]"
                }`}
              >
                <span className="block font-serif text-3xl font-light text-gold md:text-4xl">
                  {WEDDING.groomName}
                </span>
                <span className="mt-1 block text-xs uppercase tracking-[0.15em] text-stone/60">
                  {t.teamGroom}
                </span>
              </button>

              <button
                onClick={() => handleVote("bride")}
                disabled={hasVoted}
                className={`flex-1 rounded-2xl border-2 py-6 text-center transition-all duration-300 ${
                  hasVoted
                    ? "cursor-default border-rose/30 bg-rose/5"
                    : "cursor-pointer border-rose/40 hover:border-rose hover:bg-rose/10 hover:shadow-md active:scale-[0.98]"
                }`}
              >
                <span className="block font-serif text-3xl font-light text-rose md:text-4xl">
                  {WEDDING.brideName}
                </span>
                <span className="mt-1 block text-xs uppercase tracking-[0.15em] text-stone/60">
                  {t.teamBride}
                </span>
              </button>
            </div>

            {/* Result bar */}
            <AnimatePresence>
              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="flex h-10 overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: "50%" }}
                      animate={{ width: `${groomPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center justify-center bg-gold/20"
                    >
                      <span className="text-xs font-medium text-gold">
                        {groomPct}%
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ width: "50%" }}
                      animate={{ width: `${bridePct}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center justify-center bg-rose/20"
                    >
                      <span className="text-xs font-medium text-rose">
                        {bridePct}%
                      </span>
                    </motion.div>
                  </div>
                  <p className="mt-2 text-center text-xs text-stone/40">
                    {total} {t.votes}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentQ
                  ? "w-6 bg-gold"
                  : voted.has(questions[i].id)
                    ? "w-2 bg-gold/40"
                    : "w-2 bg-stone/20"
              }`}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
