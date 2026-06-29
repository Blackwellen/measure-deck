/**
 * Deterministic project cover imagery.
 * Maps a project id to a stable construction / building photograph so the same
 * project always shows the same picture across list, board, map and detail views.
 */

const COVERS = [
  "photo-1503387762-592deb58ef4e", // tower crane / construction site
  "photo-1486406146926-c627a92ad1ab", // modern glass office
  "photo-1545324418-cc1a3fa10c00",  // residential apartments
  "photo-1590725140246-20acdee442be", // building under construction
  "photo-1460472178825-e5240623afd5", // civic building
  "photo-1564013799919-ab600027ffc6", // completed housing
  "photo-1494891848038-7bd202a2afeb", // office block
  "photo-1512917774080-9991f1c4c750", // suburban build
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

/** Cover photo for a project, sized for the requested width. */
export function projectCover(id: string, width = 800): string {
  const photo = COVERS[hash(id) % COVERS.length];
  return `https://images.unsplash.com/${photo}?w=${width}&q=80&auto=format&fit=crop`;
}
