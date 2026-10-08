/* ------------------------------------------------------------------ */
/* A tiny, fictional aviation-CRM database shared by the Data lessons   */
/* ------------------------------------------------------------------ */

export type Cell = string | number | null
export interface Table {
  id: string
  name: string
  emoji: string
  what: string
  columns: string[]
  /** Column explanations shown when the header is tapped. */
  colInfo: Record<string, string>
  rows: Cell[][]
  rowLabel: (r: Cell[]) => string
}

export const USERS: Table = {
  id: 'users',
  name: 'USERS',
  emoji: '🧑‍💼',
  what: 'People who log in to your app.',
  columns: ['id', 'name', 'email', 'role'],
  colInfo: { name: 'Each user’s display name.', email: 'What they log in with. No two users share one.', role: 'What they’re allowed to do: admin or user.' },
  rows: [
    [1, 'Scott', 'scott@acme.co', 'admin'],
    [2, 'Alex', 'alex@acme.co', 'user'],
  ],
  rowLabel: (r) => `the user ${r[1]}`,
}

export const CONTACTS: Table = {
  id: 'contacts',
  name: 'CONTACTS',
  emoji: '👤',
  what: 'Customers and leads your team keeps track of.',
  columns: ['id', 'name', 'company', 'city', 'owner_id'],
  colInfo: {
    name: 'The contact’s name. Not unique — two people can share a name.',
    company: 'Where they work.',
    city: 'Where they’re based.',
    owner_id: 'Which USER looks after this contact. It holds a user’s id — a foreign key.',
  },
  rows: [
    [101, 'Maria Lopez', 'SkyWays Charter', 'Denver', 1],
    [102, 'Dev Patel', 'Patel Aviation', 'Austin', 2],
    [103, 'Priya Shah', 'Blue Ridge Flight School', 'Denver', 2],
    [104, 'Tom Becker', 'Private owner', 'Boston', 1],
    [105, 'Maria Lopez', 'Lopez Ag Services', 'Boston', 2],
    [106, 'Sam Okafor', 'Mile High Aero', 'Denver', 1],
    [107, 'Lena Ruiz', 'Ruiz Ferry Flights', 'Austin', 1],
    [108, 'Chris Wong', 'Private owner', 'Denver', 2],
  ],
  rowLabel: (r) => `${r[1]} from ${r[3]}`,
}

export const AIRCRAFT: Table = {
  id: 'aircraft',
  name: 'AIRCRAFT',
  emoji: '✈️',
  what: 'Planes your customers own.',
  columns: ['id', 'tail_number', 'model', 'year'],
  colInfo: { tail_number: 'The registration painted on the plane.', model: 'Make and model.', year: 'Year built.' },
  rows: [
    [201, 'N123AB', 'Cessna 172', 2004],
    [202, 'N77XC', 'Piper PA-28', 1998],
    [203, 'N450SR', 'Cirrus SR22', 2016],
    [204, 'N9KT', 'King Air 350', 2011],
    [205, 'N31CW', 'Beech Bonanza', 1979],
  ],
  rowLabel: (r) => `the ${r[2]} ${r[1]}`,
}

export const NOTES: Table = {
  id: 'notes',
  name: 'NOTES',
  emoji: '📝',
  what: 'What your team wrote down about each contact.',
  columns: ['id', 'contact_id', 'author_id', 'text'],
  colInfo: {
    contact_id: 'Which CONTACT this note is about — a foreign key.',
    author_id: 'Which USER wrote it — another foreign key.',
    text: 'The note itself.',
  },
  rows: [
    [301, 101, 1, 'Wants annual inspection quote'],
    [302, 101, 2, 'Prefers texts over calls'],
    [303, 103, 2, 'Renewing fleet insurance in May'],
    [304, 104, 1, 'Thinking of selling the SR22'],
    [305, 102, 2, 'Intro’d by Priya'],
    [306, 106, 1, 'Needs ferry pilot in June'],
  ],
  rowLabel: (r) => `the note “${r[3]}”`,
}

export const DOCUMENTS: Table = {
  id: 'documents',
  name: 'DOCUMENTS',
  emoji: '📄',
  what: 'Files attached to contacts — registrations, insurance, logbooks.',
  columns: ['id', 'contact_id', 'aircraft_id', 'filename'],
  colInfo: {
    contact_id: 'Which CONTACT the file belongs to — a foreign key.',
    aircraft_id: 'Which AIRCRAFT it’s about — another foreign key.',
    filename: 'The file’s name. The file itself lives in file storage, not here.',
  },
  rows: [
    [401, 101, 201, 'registration_N123AB.pdf'],
    [402, 101, 204, 'insurance_N9KT.pdf'],
    [403, 103, 202, 'logbook_N77XC.pdf'],
    [404, 104, 203, 'bill_of_sale_N450SR.pdf'],
  ],
  rowLabel: (r) => `the file ${r[3]}`,
}

/** Join table: which contacts own which aircraft (many-to-many). */
export const OWNERS: Table = {
  id: 'owners',
  name: 'AIRCRAFT_OWNERS',
  emoji: '🔗',
  what: 'Links contacts to aircraft. One row per “this person owns that plane”.',
  columns: ['contact_id', 'aircraft_id'],
  colInfo: {},
  rows: [
    [101, 201],
    [101, 204],
    [102, 202],
    [103, 202],
    [104, 203],
    [108, 205],
  ],
  rowLabel: (r) => `contact ${r[0]} owns aircraft ${r[1]}`,
}

export const TABLES = [CONTACTS, AIRCRAFT, NOTES, DOCUMENTS, USERS]

