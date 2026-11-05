import { createElement, useEffect, useRef, type ReactNode } from 'react';

interface Props {
  as?: 'p' | 'h2' | 'div' | 'figure' | 'a';
  className?: string;
  children?: ReactNode;
  innerRef?: React.RefObject<HTMLElement | null>;
  [key: string]: unknown;
}

/** Elemen yang muncul halus saat masuk layar */
export function Reveal({ as = 'div', className = '', children, innerRef, ...rest }: Props) {
  const own = useRef<HTMLElement>(null);
  const ref = innerRef ?? own;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e, o) => {
        if (e[0].isIntersecting) {
          el.classList.add('is-in');
          o.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return createElement(as, { ref, className: `reveal ${className}`.trim(), ...rest }, children);
}
