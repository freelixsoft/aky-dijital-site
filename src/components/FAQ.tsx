"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems } from "@/lib/content";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="grid gap-3">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="surface rounded-lg">
            <button
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
            >
              <span className="text-base font-bold text-white">{item.question}</span>
              <ChevronDown
                className={`size-5 shrink-0 text-acid transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen ? <p className="px-4 pb-5 text-sm leading-7 text-fog-400 sm:px-5">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
