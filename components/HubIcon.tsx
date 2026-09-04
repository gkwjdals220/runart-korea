type HubIconName =
  | "history" | "pb" | "shoe" | "shoeGuide" | "treadmill" | "saved" | "race"
  | "raceSearch" | "crew" | "profile" | "account" | "addRun" | "activity" | "completed"
  | "crewRace" | "manage" | "course" | "gps";

export default function HubIcon({name}:{name:HubIconName}){
  const common={width:28,height:28,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
  const paths:Record<HubIconName,React.ReactNode>={
    history:<><path d="M4 13.5c3.2 0 5-1.4 6.3-4.6l1.2-3c.4-1 1.6-1.4 2.5-.8l5 3.1c1 .6 1.4 1.9.8 2.9l-1.2 2.1c-.8 1.4-2.3 2.3-3.9 2.3H9.2c-1.5 0-2.8.8-3.5 2.1L5 19H3.4l.9-3.2"/><path d="M9.7 9.9c1.8 1.5 4.4 2.6 7.7 2.9"/></>,
    pb:<><path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z"/><path d="M6 5H4v1.5A3.5 3.5 0 0 0 7.5 10M18 5h2v1.5A3.5 3.5 0 0 1 16.5 10M12 12v4M8.5 20h7M10 16h4v4h-4z"/></>,
    shoe:<><path d="M4 14.5c2.8.1 4.8-.9 6.4-3.2l1.8-2.7 2.1 2.4 4.8 2.1c1.3.6 1.9 2.1 1.3 3.3-.5 1.1-1.6 1.8-2.8 1.8H8.3c-2 0-3.6-1.2-4.3-3.7Z"/><path d="M11 12.2l2.8 1.5M9.5 14l2.5 1.3"/></>,
    shoeGuide:<><path d="M4 15c2.4 0 4.6-.8 6.2-3l1.7-2.4 2 2.1 4.9 2.2c1.3.6 1.8 2.2 1.1 3.4-.6 1-1.6 1.6-2.8 1.6H8.4c-2.2 0-3.8-1.3-4.4-3.9Z"/><path d="M7.5 7.8 9 5.5l1.5 2.3M17.2 5.5v3M15.7 7h3"/></>,
    treadmill:<><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M7 19h10M9 16l-1 3M15 16l1 3M8 9h8"/></>,
    saved:<><path d="M12 20s-7-4.3-7-9.1A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7 3.4C19 15.7 12 20 12 20Z"/></>,
    race:<><path d="M5 20V4"/><path d="M6 5h9l-1.6 2.8L15 11H6"/><path d="M9 15h8M9 18h6"/></>,
    raceSearch:<><path d="M5 20V4M6 5h8l-1.4 2.5L14 10H6"/><circle cx="16.5" cy="15.5" r="2.8"/><path d="m18.6 17.6 2 2"/></>,
    crew:<><circle cx="8" cy="9" r="2.5"/><circle cx="16" cy="9" r="2.5"/><path d="M3.8 18c.6-3 2.1-4.5 4.2-4.5S11.6 15 12.2 18M11.8 18c.6-3 2.1-4.5 4.2-4.5s3.6 1.5 4.2 4.5"/></>,
    profile:<><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.8-4.2 3-6.3 6.5-6.3s5.7 2.1 6.5 6.3"/></>,
    account:<><path d="M12 3.8 18.5 6v5.1c0 4.1-2.6 7.2-6.5 9.1-3.9-1.9-6.5-5-6.5-9.1V6L12 3.8Z"/><path d="M9 11.5 11.2 14 15.5 9.5"/></>,
    addRun:<><path d="M12 4v16M4 12h16"/></>,
    activity:<><path d="M4 17.5h4l2.2-6 3.1 8 2.3-5h4.4"/></>,
    completed:<><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.3 4.8-5"/></>,
    crewRace:<><path d="M4 20V4M5 5h9l-1.5 2.5L14 10H5"/><circle cx="17" cy="15" r="2"/><path d="M13.5 20c.5-2.3 1.7-3.5 3.5-3.5s3 1.2 3.5 3.5"/></>,
    manage:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.1l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></>,
    course:<><path d="M5 19c1.5-3.8 3.4-5.7 5.8-5.7 3.2 0 3.4-3.7 7.2-7.3"/><circle cx="5" cy="19" r="1.5"/><circle cx="18" cy="6" r="1.5"/></>,
    gps:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></>
  };
  return <span className="hubIconBox"><svg {...common}>{paths[name]}</svg></span>;
}
