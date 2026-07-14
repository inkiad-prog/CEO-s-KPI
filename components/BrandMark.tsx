import Image from 'next/image';
import Link from 'next/link';

export function BrandMark({
  size = 'md',
  linked = true,
  priority = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  linked?: boolean;
  priority?: boolean;
}) {
  const height = size === 'lg' ? 'h-10' : size === 'sm' ? 'h-6' : 'h-8';

  const mark = (
    <Image
      src="/logo.png"
      alt="Akij Resource"
      width={540}
      height={126}
      className={`${height} w-auto`}
      priority={priority}
    />
  );

  if (!linked) return mark;
  return (
    <Link href="/" className="inline-block shrink-0">
      {mark}
    </Link>
  );
}
