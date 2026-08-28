import { Variants, Easing } from 'motion/react';

/**
 * PAGORA Design System — Motion & Animation Tokens
 * 
 * Durações, curvas e variantes padronizadas para microinterações e transições.
 * Respeita rigorosamente preferências de redução de movimento (prefers-reduced-motion).
 */

export const MOTION_TIERS = {
  FAST: 0.14,    // 140ms: feedback táctil imediato, botões, toggles, badges
  NORMAL: 0.22,  // 220ms: transições de componentes, dropdowns, tabs, expansões
  SLOW: 0.30,    // 300ms: modais, gavetas de navegação, superfícies de decisão
} as const;

export const MOTION_DURATIONS = {
  micro: MOTION_TIERS.FAST,
  component: MOTION_TIERS.NORMAL,
  surface: MOTION_TIERS.SLOW,
  page: 0.28,
} as const;

export const MOTION_EASINGS = {
  natural: [0.16, 1, 0.3, 1] as [number, number, number, number],       // Ease-out natural para entradas suaves
  standard: [0.2, 0, 0, 1] as [number, number, number, number],         // Curva padrão rápida
  decelerate: [0.0, 0.0, 0.2, 1] as [number, number, number, number],   // Desaceleração para entradas
  accelerate: [0.4, 0.0, 1, 1] as [number, number, number, number],     // Aceleração para saídas imediatas
};

// Micro-interações de clique e toque (press/active)
export const tapMicro = {
  scale: 0.97,
  transition: { duration: 0.08, ease: MOTION_EASINGS.standard },
};

export const tapCard = {
  scale: 0.99,
  transition: { duration: 0.08, ease: MOTION_EASINGS.standard },
};

// Transições de ecrã/página discretas (sem scroll-jacking, sem atraso perceptível)
export const pageViewVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.page,
      ease: MOTION_EASINGS.natural,
    },
  },
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.page,
      ease: MOTION_EASINGS.natural,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: MOTION_TIERS.FAST,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};

export const pageTransitionVariants: Variants = pageViewVariants;

// Variantes para componentes suspensos e menus
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_TIERS.FAST,
      ease: MOTION_EASINGS.natural,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};

// Variantes padronizadas para modais
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_TIERS.SLOW,
      ease: MOTION_EASINGS.natural,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: MOTION_TIERS.FAST,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};

// Variantes para itens de lista e tabelas
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.03, 0.18),
      duration: MOTION_TIERS.NORMAL,
      ease: MOTION_EASINGS.natural,
    },
  }),
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_TIERS.FAST,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};

// Variantes para alertas e Toasts
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_TIERS.NORMAL,
      ease: MOTION_EASINGS.natural,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    transition: {
      duration: MOTION_TIERS.FAST,
      ease: MOTION_EASINGS.accelerate,
    },
  },
};
