import Image from "next/image";
import { cx } from "@/utils/cx";

export function AcademyContentImage({
  imageUrl,
  alt,
  placeholder = "Grafika szkolenia",
  className,
}: {
  imageUrl?: string | null;
  alt: string;
  placeholder?: string;
  className?: string;
}) {
  return imageUrl ? (
    <div
      role="img"
      aria-label={alt}
      className={cx("overflow-hidden bg-background-secondary-default bg-cover bg-center", className)}
      style={{ backgroundImage: `url("${imageUrl}")` }}
    />
  ) : (
    <div
      role="img"
      aria-label={placeholder ? `${alt} — ${placeholder}` : alt}
      className={cx(
        "relative overflow-hidden bg-background-secondary-default",
        className,
      )}
    >
      <Image
        src="/assets/no-image-placeholder.png"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 28rem"
        className="object-cover"
      />
    </div>
  );
}
