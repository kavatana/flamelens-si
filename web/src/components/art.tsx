import Image from "next/image";

/** The label every SI-generated picture carries on screen. NASA Space Apps requires a visible mark. */
export function SiMark({ short = false, className = "" }: { short?: boolean; className?: string }) {
  return (
    <span className={`si-mark ${className}`} title="This picture was generated with SI image tools. It is not a NASA image.">
      {short ? "SI" : "SI-generated"}
      {short && <span className="sr-only">-generated picture</span>}
    </span>
  );
}

/**
 * A concept drawing, generated with SI image tools and marked as such. When an animated
 * version exists and `play` is set, the clip plays in its place, silently and on a loop;
 * visitors who ask for reduced motion keep the still. `className` sizes the frame.
 */
export function Art({ src, clip, play, alt = "", className = "", short = false }: { src: string; clip?: string; play?: boolean; alt?: string; className?: string; short?: boolean }) {
  const media = "h-full w-full object-contain mix-blend-multiply";
  return (
    <span className={`relative block ${className}`}>
      {clip && play ? (
        <>
          <video src={clip} poster={src} autoPlay loop muted playsInline aria-label={alt || undefined} className={`${media} motion-reduce:hidden`} />
          <Image src={src} alt={alt} width={960} height={720} className={`${media} hidden motion-reduce:block`} />
        </>
      ) : (
        <Image src={src} alt={alt} width={960} height={720} className={media} />
      )}
      <SiMark short={short} />
    </span>
  );
}
