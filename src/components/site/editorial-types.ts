export type EditorialTrack = {
  id: string;
  slug: string;
  title: string;
  arabicTitle?: string;
  category?: string;
  summary?: string;
  capabilities: string[];
  color: string;
  ink: string;
};

export type EditorialPerson = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  committee?: string;
  scope: string;
};

export type EditorialEvent = {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary?: string;
};

export type EditorialPartner = {
  id: string;
  name: string;
  href?: string;
};
