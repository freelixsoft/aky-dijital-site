type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left"
}: SectionHeaderProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="text-balance text-[clamp(2rem,7vw,3.25rem)] font-black leading-[1.08] tracking-normal text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-8 text-fog-400 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
