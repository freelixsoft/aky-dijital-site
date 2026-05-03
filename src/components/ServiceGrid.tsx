"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MotionDiv } from "@/components/Motion";
import { iconMap } from "@/components/IconMap";
import type { Service } from "@/lib/content";

type ServiceGridProps = {
  services: Service[];
  detailed?: boolean;
};

export function ServiceGrid({ services, detailed = false }: ServiceGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service, index) => {
        const Icon = iconMap[service.icon];

        return (
          <MotionDiv
            key={service.title}
            className="group surface flex min-h-full flex-col rounded-lg p-4 transition duration-300 hover:-translate-y-1 hover:border-electric/50 hover:bg-white/[0.07] sm:p-5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.45, delay: index * 0.04 }}
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-electric/12 text-electric transition group-hover:bg-acid/12 group-hover:text-acid">
              {Icon ? <Icon className="size-5" /> : null}
            </div>
            <h3 className="mt-5 break-words text-lg font-black text-white sm:text-xl">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-fog-400">{service.short}</p>

            {detailed ? (
              <div className="mt-6 grid gap-5 text-sm leading-7 text-fog-400">
                <div>
                  <p className="font-bold text-fog-100">Kimler için uygundur?</p>
                  <p className="mt-1">{service.fit}</p>
                </div>
                <div>
                  <p className="font-bold text-fog-100">Neler yapılır?</p>
                  <ul className="mt-2 grid gap-2">
                    {service.actions.map((action) => (
                      <li key={action} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 bg-acid" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-fog-100">İşletmeye katkısı</p>
                  <p className="mt-1">{service.impact}</p>
                </div>
              </div>
            ) : null}

            <Link href="/iletisim" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-acid">
              Teklif al
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </MotionDiv>
        );
      })}
    </div>
  );
}
