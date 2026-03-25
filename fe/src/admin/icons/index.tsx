import React from 'react';

// Inline SVG icons - CRA compatible (no ?react import needed)

export const GridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 3H9V9H3V3ZM3 11H9V17H3V11ZM11 3H17V9H11V3ZM11 11H17V17H11V11Z" fill="currentColor"/>
  </svg>
);

export const CalenderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a3 3 0 013 3v12a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h1V3a1 1 0 011-1zm-2 6a1 1 0 000 2h14a1 1 0 000-2H5zm0 4a1 1 0 000 2h8a1 1 0 000-2H5z" fill="currentColor"/>
  </svg>
);

export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4a3 3 0 100 6 3 3 0 000-6zm-4.472 9.867A7.97 7.97 0 0012 17a7.97 7.97 0 004.472-1.133A5.002 5.002 0 0012 13a5.002 5.002 0 00-4.472 2.867z" fill="currentColor"/>
  </svg>
);

export const ListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 7a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 7a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1z" fill="currentColor"/>
  </svg>
);

export const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3v2h14V7H5zm0 4v2h6v-2H5zm8 0v2h6v-2h-6zm-8 4v2h6v-2H5zm8 0v2h6v-2h-6z" fill="currentColor"/>
  </svg>
);

export const PageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L18.5 8H13V3.5zM8 13a1 1 0 011-1h6a1 1 0 010 2H9a1 1 0 01-1-1zm1 3a1 1 0 000 2h4a1 1 0 000-2H9z" fill="currentColor"/>
  </svg>
);

export const PieChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M11 2.05V13h10.95A10.001 10.001 0 0111 2.05zM13 2.05V11h8.95A10.002 10.002 0 0013 2.05zM2 13c0 5.523 4.477 10 10 10a9.99 9.99 0 007.071-2.929L10 13H2z" fill="currentColor"/>
  </svg>
);

export const BoxCubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-5l-10 5-10-5v5zm0-5l10 5 10-5V7l-10 5L2 7v5z" fill="currentColor"/>
  </svg>
);

export const PlugInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7 2a1 1 0 011 1v3h8V3a1 1 0 112 0v3h1a2 2 0 012 2v2a5 5 0 01-4 4.9V21a1 1 0 11-2 0v-5.1A5 5 0 017 11V8a2 2 0 012-2h1V3a1 1 0 011-1z" fill="currentColor"/>
  </svg>
);

export const HorizontaLDots: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5 12a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" fill="currentColor"/>
  </svg>
);

export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" fill="currentColor"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" fill="currentColor"/>
  </svg>
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
  </svg>
);

export const EyeCloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-5 0-9.27-3.11-11-7.5a10.08 10.08 0 012.82-4.11m3.01-2.12A9.94 9.94 0 0112 4c5 0 9.27 3.11 11 7.5a10.1 10.1 0 01-1.67 2.9M9.9 4.24A9.12 9.12 0 0112 4m-4.14 1.86L3 3m18 18l-4.14-4.14M14.12 14.12A3 3 0 019.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm3 8V7a3 3 0 10-6 0v3h6zm-3 3a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" fill="currentColor"/>
  </svg>
);

export const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm2 0l7 5 7-5H5zm0 2.236V18h14V8.236l-7 5-7-5z" fill="currentColor"/>
  </svg>
);

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 4a4 4 0 100 8 4 4 0 000-8zm-6 9a6 6 0 1112 0v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1z" fill="currentColor"/>
  </svg>
);

export const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 19V5m-7 7l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5v14m7-7l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AngleDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = ChevronDownIcon;
export const AngleUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = ChevronUpIcon;
export const AngleLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = ChevronLeftIcon;
export const AngleRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fill="currentColor"/>
  </svg>
);

export const BoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = BoxCubeIcon;
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 7.293a1 1 0 00-1.414-1.414L10 13.172l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l6-6z" fill="currentColor"/>
  </svg>
);

export const AlertIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 11a1 1 0 01-1-1V8a1 1 0 112 0v4a1 1 0 01-1 1zm0 4a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
  </svg>
);

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = AlertIcon;
export const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = AlertIcon;
export const AlertHexaIcon: React.FC<React.SVGProps<SVGSVGElement>> = AlertIcon;
export const ErrorHexaIcon: React.FC<React.SVGProps<SVGSVGElement>> = AlertIcon;

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TrashBinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M9 3a1 1 0 00-1 1H5a1 1 0 100 2h14a1 1 0 100-2h-3a1 1 0 00-1-1H9zM6 8l1 11a2 2 0 002 2h6a2 2 0 002-2l1-11H6z" fill="currentColor"/>
  </svg>
);

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M15.232 5.232l3.536 3.536-9.9 9.9-4.95.707.707-4.95 9.9-9.9zM18.707 2.293a1 1 0 00-1.414 0l-1.768 1.768 3.536 3.536 1.768-1.768a1 1 0 000-1.414l-2.122-2.122z" fill="currentColor"/>
  </svg>
);

export const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DocsIcon: React.FC<React.SVGProps<SVGSVGElement>> = PageIcon;
export const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = EnvelopeIcon;
export const GroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = UserCircleIcon;
export const TaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = CheckCircleIcon;
export const BoxIconLine: React.FC<React.SVGProps<SVGSVGElement>> = BoxCubeIcon;
export const ShootingStarIcon: React.FC<React.SVGProps<SVGSVGElement>> = BoltIcon;
export const DollarLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = PageIcon;
export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = AngleRightIcon;
export const CheckLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = CheckCircleIcon;
export const CloseLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = CloseIcon;
export const PaperPlaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export const TimeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4a1 1 0 011 1v4.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 0111 12V7a1 1 0 011-1z" fill="currentColor"/>
  </svg>
);
export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = PageIcon;
export const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2 6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H7l-4 3V6z" fill="currentColor"/>
  </svg>
);
export const MoreDotIcon: React.FC<React.SVGProps<SVGSVGElement>> = HorizontaLDots;
export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
export const AudioIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = PageIcon;
