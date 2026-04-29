const paths = {
  battery: (
    <>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21 11v2" />
      <path d="M7 11h6" />
    </>
  ),
  boxes: (
    <>
      <path d="m7.5 4 4.5 2.6L16.5 4" />
      <path d="M12 6.6v5.2" />
      <path d="M7.5 4 3 6.6v5.2l4.5 2.6 4.5-2.6 4.5 2.6 4.5-2.6V6.6L16.5 4 12 6.6 7.5 4Z" />
      <path d="M16.5 14.4V9.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h4l1.5-2h5L16 8h4v10H4V8Z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  check: (
    <>
      <path d="M20 7 9 18l-5-5" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3v3" />
      <path d="M14 3v3" />
      <path d="M10 18v3" />
      <path d="M14 18v3" />
      <path d="M3 10h3" />
      <path d="M3 14h3" />
      <path d="M18 10h3" />
      <path d="M18 14h3" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l4 4v14H7V3Z" />
      <path d="M14 3v5h4" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m7 17 4-4 3 3 2-2 3 3" />
    </>
  ),
  robot: (
    <>
      <rect x="6" y="8" width="12" height="10" rx="3" />
      <path d="M12 5v3" />
      <circle cx="9.5" cy="13" r="1" />
      <circle cx="14.5" cy="13" r="1" />
      <path d="M9 18v2" />
      <path d="M15 18v2" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  signature: (
    <>
      <path d="M4 18c3-5 5-7 6-6 1.4 1.4-2 5 0 5 1.5 0 3-3 4-3 .8 0 .8 2 2 2 1 0 1.5-.6 2-1" />
      <path d="M4 21h16" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="11" cy="18" r="2" />
    </>
  )
};

export default function Icon({ name, className = "size-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.file}
    </svg>
  );
}
