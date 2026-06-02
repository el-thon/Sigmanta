"use client";

import { useEffect, useState } from "react";

const phrases = [
  "Selamatkan Bumi.",
  "Petakan Risiko.",
  "Lindungi Wilayahmu.",
  "Data Geospasial untuk Keputusan Nyata.",
  "Mitigasi Dimulai dari Peta.",
];

export function Typewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    const doneWriting = !isDeleting && charIndex === phrase.length;
    const doneDeleting = isDeleting && charIndex === 0;

    const timeout = window.setTimeout(
      () => {
        if (doneWriting) {
          setIsDeleting(true);
          return;
        }

        if (doneDeleting) {
          setIsDeleting(false);
          setPhraseIndex((current) => (current + 1) % phrases.length);
          return;
        }

        setCharIndex((current) => current + (isDeleting ? -1 : 1));
      },
      doneWriting ? 2200 : doneDeleting ? 400 : isDeleting ? 30 : 55,
    );

    return () => window.clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

  return (
    <span>
      {phrases[phraseIndex].slice(0, charIndex)}
      <span className="ml-1 animate-pulse">|</span>
    </span>
  );
}
