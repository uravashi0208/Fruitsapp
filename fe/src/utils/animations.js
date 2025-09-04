import { motion } from 'framer-motion';

// Basic animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const slideUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

export const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const bounce = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.175, 0.885, 0.32, 1.275],
      type: 'spring',
      stiffness: 120,
    },
  },
};

// Stagger animations for children
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const hoverLift = {
  y: -8,
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  transition: { duration: 0.3, ease: 'easeOut' },
};

// Button animations
export const buttonHover = {
  scale: 1.05,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.2, ease: 'easeOut' },
};

// Parallax effect
export const parallax = {
  y: [0, -20],
  transition: {
    duration: 1.5,
    ease: 'easeOut',
    repeat: Infinity,
    repeatType: 'reverse',
  },
};

// Custom motion components
export const MotionBox = motion.div;
export const MotionContainer = motion.div;

// Cart-specific animations
export const cartSlideIn = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const cartItemStagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

export const cartItemRemove = {
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

export const quantityChange = {
  scale: [1, 1.2, 1],
  transition: { duration: 0.3 },
};

export const cartPulse = {
  scale: [1, 1.02, 1],
  transition: { duration: 0.4, repeat: 1 },
};

export const successCheckmark = {
  scale: [0, 1.2, 1],
  opacity: [0, 1, 1],
  transition: { duration: 0.6, ease: 'easeOut' },
};
