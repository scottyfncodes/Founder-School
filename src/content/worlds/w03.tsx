import type { World } from '../../lib/types'
import { Categorize } from '../../widgets/Categorize'
import { Sorter } from '../../widgets/Sorter'
import { TableBrowser, TwoMarias } from '../../widgets/MiniDB'
import { DeleteRules, RelationExplorer } from '../../widgets/RelationLab'
import { QueryBuilder } from '../../widgets/QueryLab'
import { IndexRace } from '../../widgets/IndexRace'
import { MigrationSim } from '../../widgets/MigrationSim'
import { FileLab } from '../../widgets/FileLab'

const world: World = {
  id: 'w3',
  num: 3,
  title: 'Data',
  tagline: 'Tables, relationships, queries and files.',
  emoji: '🗄️',
  color: '#0c8599',
  skill: 'data',
  concepts: [
    { id: 'tables', name: 'Tables, rows & columns' },
    { id: 'primary-keys', name: 'IDs & primary keys' },
    { id: 'foreign-keys', name: 'Foreign keys' },
    { id: 'relationships', name: 'One-to-many & many-to-many' },
    { id: 'queries', name: 'Queries' },
    { id: 'indexes', name: 'Indexes' },
    { id: 'migrations', name: 'Migrations' },
    { id: 'file-storage', name: 'File storage & pointers' },
    { id: 'bucket-access', name: 'Public vs. private files' },
  ],
  lessons: [
    {
      id: 'w3-tables',
      title: 'Tables, rows & IDs',
      subtitle: 'Open a real (tiny) database and find your way around.',
      minutes: 6,
      concepts: ['tables', 'primary-keys'],
      steps: [
        {
          kind: 'concept',
          emoji: '🗃️',
          title: 'A database is a set of very strict spreadsheets',
          what: 'Each table holds one kind of thing — contacts, aircraft, notes. Each row is one item. Each column is one fact about every item.',
          why: 'Strict structure is what lets software find, sort and connect millions of records instantly, without guessing.',
        },
        {
          kind: 'widget',
          title: 'Explore the database',
          instruction: 'This is the database behind a small aviation CRM. Switch tables, tap rows and column names.',
          render: ({ done }) => <TableBrowser onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The vocabulary',
          points: [
            { term: 'Table', text: 'One kind of thing. CONTACTS, AIRCRAFT, NOTES…' },
            { term: 'Row (record)', text: 'One item: one contact, one plane, one note.' },
            { term: 'Column (field)', text: 'One fact, with one type, for every row: “city” is always text, “year” always a number.' },
            { term: '🔑 Primary key', text: 'A column — usually “id” — that’s unique for every row and never changes. It’s the row’s true name.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Two Marias',
          instruction: 'A customer asks to be deleted. Choose a command and see which rows it hits.',
          render: ({ done }) => <TwoMarias onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w3-tables-q1',
          prompt: 'In the CONTACTS table, what is one row?',
          level: 2,
          concepts: ['tables'],
          options: [
            { text: 'Every contact’s city', why: 'That’s a column: one fact repeated for every contact.' },
            { text: 'One contact, with all of their facts', correct: true, why: 'A row is one item. Its cells hold that item’s value for each column.' },
            { text: 'The whole list of contacts', why: 'That’s the table itself.' },
            { text: 'A contact’s notes', why: 'Notes live in their own NOTES table and point back to the contact.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-tables-q2',
          context: 'Your agent suggests using each customer’s email address as their primary key, instead of a number.',
          prompt: 'What’s the problem?',
          level: 3,
          concepts: ['primary-keys'],
          options: [
            { text: 'Emails are too long to store', why: 'Storage isn’t the issue. Databases store long text happily.' },
            { text: 'People change emails — and a primary key must never change', correct: true, why: 'Every note, document and invoice points at that key. If it changes, all those links break. Use a meaningless id that never changes; store email as a normal column.' },
            { text: 'Emails can’t be searched', why: 'Emails can be searched (and should be indexed). That’s not the concern here.' },
            { text: 'No problem — emails are unique', why: 'Unique today, but not permanent. Keys must be unique and unchanging.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-tables-q3',
          prompt: 'Why did “delete where name = Maria Lopez” go wrong?',
          level: 2,
          concepts: ['primary-keys', 'tables'],
          options: [
            { text: 'The database had a bug', why: 'The database did exactly what it was told: delete every row with that name.' },
            { text: 'Names aren’t unique; only the id points at exactly one row', correct: true, why: 'Two people can share a name. The primary key is the one thing guaranteed to identify a single row.' },
            { text: 'Deleting should always be done by hand', why: 'Deleting by id is perfectly safe. The mistake was the choice of column.' },
            { text: 'The name was spelled wrong', why: 'It was spelled right — for both Marias. That’s the problem.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Your data model is the skeleton of your product. Ask your agent to show you the tables — it’s the fastest way to understand any app.',
            'Anything destructive (delete, merge, export) should target ids, never names or emails.',
            'Clean, consistent columns now = easy reports, imports and migrations later.',
          ],
        },
      ],
    },
    {
      id: 'w3-relationships',
      title: 'Relationships',
      subtitle: 'How notes, documents and planes point back to the right person.',
      minutes: 8,
      concepts: ['foreign-keys', 'relationships'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔗',
          title: 'Rows point at other rows',
          what: 'A note doesn’t copy the contact’s details. It stores the contact’s id in a column like contact_id. That stored id is a foreign key.',
          why: 'Store each fact once, point to it everywhere. Change Maria’s phone number once and every note, document and invoice is still connected to the right Maria.',
        },
        {
          kind: 'widget',
          title: 'Tap a contact',
          instruction: 'Tap 3 contacts (try Dev or Priya). Watch which rows light up in the other tables.',
          render: ({ done }) => <RelationExplorer onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Relationship shapes',
          points: [
            { term: 'Foreign key', text: 'A column holding another table’s id: notes.contact_id → contacts.id.' },
            { term: 'One-to-many', text: 'One contact, many notes. The foreign key goes on the “many” side.' },
            { term: 'Many-to-many', text: 'People own many planes; planes have many owners. Needs a link table like AIRCRAFT_OWNERS.' },
            { term: 'Orphan', text: 'A row whose foreign key points at something that no longer exists.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Delete a contact',
          instruction: 'Pick a rule, delete Maria, and see what happens to her notes and documents. Try all three.',
          render: ({ done }) => <DeleteRules onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w3-relationships-q1',
          prompt: 'A note has contact_id = 103. What does that mean?',
          level: 2,
          concepts: ['foreign-keys'],
          options: [
            { text: 'It’s the 103rd note', why: 'The note’s own number is its id column. contact_id points somewhere else.' },
            { text: 'The note is about the contact whose id is 103', correct: true, why: 'That’s a foreign key: it stores another table’s primary key to link the two rows.' },
            { text: 'The note was written by user 103', why: 'The author is stored in author_id, a different foreign key to USERS.' },
            { text: 'The note has 103 words', why: 'Columns ending in _id almost always point at another table’s row.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-relationships-q2',
          context: 'You want contacts to belong to teams. A contact can be in several teams, and a team has many contacts.',
          prompt: 'What does your engineer need to add?',
          level: 3,
          concepts: ['relationships', 'foreign-keys'],
          options: [
            { text: 'A team_id column on CONTACTS', why: 'That allows only one team per contact — a one-to-many, not what you described.' },
            { text: 'A TEAMS table plus a link table (contact_id, team_id)', correct: true, why: 'Many-to-many needs a link table, exactly like AIRCRAFT_OWNERS. One row per “this contact is in that team”.' },
            { text: 'A text column listing team names', why: 'Typos, renames and counting all become painful. Lists in a text column are a classic shortcut that bites later.' },
            { text: 'A separate copy of the contact for each team', why: 'Duplicates drift apart: update one copy and the others are wrong.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-relationships-q3',
          context: 'Customers can delete their account. Each account has invoices you must keep for 7 years for tax.',
          prompt: 'Which delete rule should invoices use?',
          level: 4,
          concepts: ['relationships', 'foreign-keys'],
          options: [
            { text: 'Cascade — delete invoices with the account', why: 'You’d silently destroy records you’re legally required to keep.' },
            { text: 'No rule — leave them pointing at nothing', why: 'Orphaned invoices break reports and point at a customer who no longer exists.' },
            { text: 'Block (restrict) — and handle it deliberately, e.g. anonymise the account instead', correct: true, why: 'Restrict stops accidental loss, forcing a conscious decision: keep invoices, strip personal details. Cascade suits drafts, not records.' },
            { text: 'Delete the invoices first, then the account', why: 'Same outcome as cascade, with extra steps — the invoices are gone.' },
          ],
        },
        {
          kind: 'care',
          points: [
            '“What happens to X when Y is deleted?” is one of the best questions you can ask your agent about any feature.',
            'Duplicated data drifts. If the same fact lives in two places, one of them will eventually be wrong.',
            'Getting relationships right early is cheap. Changing a one-to-many into a many-to-many later means a migration.',
          ],
        },
      ],
    },
    {
      id: 'w3-queries',
      title: 'Queries & indexes',
      subtitle: 'Asking your data questions — and making the answers fast.',
      minutes: 9,
      concepts: ['queries', 'indexes'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔎',
          title: 'A query is a precise question',
          what: 'A query asks the database for exactly the rows you want: “Alex’s contacts in Denver, sorted by name.” Most databases speak a language called SQL.',
          why: 'Every screen, search box, report and dashboard is a query. The database does the searching so your app doesn’t have to load everything.',
        },
        {
          kind: 'widget',
          title: 'Build a query',
          instruction: 'Tap filters to answer each challenge. Watch the English question and the SQL change together.',
          render: ({ done }) => <QueryBuilder onDone={done} />,
        },
        {
          kind: 'concept',
          emoji: '📇',
          title: 'Indexes: the back of the book',
          what: 'An index is a sorted lookup list for one column, like the index at the back of a book. The database jumps straight to the right rows instead of reading every one.',
          why: 'With 1,000 rows, reading everything is instant. With 10 million, it takes seconds — for every search, by every user.',
        },
        {
          kind: 'widget',
          title: 'Race: index vs. no index',
          instruction: 'Race at small and large sizes. Finish with 10 million rows.',
          render: ({ done }) => <IndexRace onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w3-queries-q1',
          prompt: 'Your dashboard shows “Revenue this month by plan”. What produced those numbers?',
          level: 2,
          concepts: ['queries'],
          options: [
            { text: 'Someone typed them in each morning', why: 'Possible in a spreadsheet, but apps calculate this live from the data.' },
            { text: 'A query that filters and adds up rows', correct: true, why: 'Dashboards are queries: pick this month’s payments, group by plan, add them up.' },
            { text: 'The API invents them', why: 'The API passes along what the database query returns. It doesn’t invent data.' },
            { text: 'An index', why: 'An index can make the query fast, but the query is what asks the question.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-queries-q2',
          context: 'Search was instant at launch. Now, with 2 million contacts, it takes 6 seconds.',
          prompt: 'What’s the best first question for your engineer?',
          level: 3,
          concepts: ['indexes', 'queries'],
          options: [
            { text: '“Should we buy a much bigger database server?”', why: 'Maybe later — but a missing index is far more common and almost free to fix.' },
            { text: '“Is the column we search on indexed?”', correct: true, why: 'Slow-as-it-grows is the classic missing-index symptom. Adding one can turn seconds into milliseconds.' },
            { text: '“Should we delete old contacts?”', why: 'Deleting customer data to fix speed is drastic — and it only buys time.' },
            { text: '“Can we hide the search box?”', why: 'That removes a feature instead of fixing the cause.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-queries-q3',
          context: 'An engineer says: “Let’s just add an index on every column, to be safe.”',
          prompt: 'What’s the trade-off?',
          level: 4,
          concepts: ['indexes'],
          options: [
            { text: 'None — indexes only make things faster', why: 'Reads get faster, but every insert and update must also update every index.' },
            { text: 'Every save gets slower and storage grows; index the columns you actually search and sort by', correct: true, why: 'Indexes cost write speed and disk. Good teams add them for real query patterns, and check slow-query reports.' },
            { text: 'Indexes delete data', why: 'Indexes never change your data; they’re extra lookup lists alongside it.' },
            { text: 'Queries stop working', why: 'Queries work the same with or without indexes — just at different speeds.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Apps that are fast in testing and slow with real customers often just need an index. Ask before paying for bigger servers.',
            'Every report you want — churn, revenue by plan, top customers — is a query. If the data is structured well, it’s a quick ask.',
            'Ask for a “slow query” report from your database. It’s a free to-do list for speed.',
          ],
        },
      ],
    },
    {
      id: 'w3-migrations',
      title: 'Migrations',
      subtitle: 'Changing the shape of live data — without losing any.',
      minutes: 7,
      concepts: ['migrations'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏗️',
          title: 'Renovating while people live in the house',
          what: 'A migration is a script that changes the database’s structure — adding a column, splitting a field, creating a table — while real data is in it.',
          why: 'Products evolve, so the data’s shape must too. But the live app and its customers are using that data at the same moment.',
        },
        {
          kind: 'widget',
          title: 'Split the name column',
          instruction: 'Try the quick way first. Then do it the safe way, step by step.',
          render: ({ done }) => <MigrationSim onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Put the safe migration in order',
          instruction: 'Arrange the steps from first to last, then check.',
          render: ({ done }) => (
            <Sorter
              onDone={done}
              explain="Back up, expand, copy, switch the app, and only then remove the old. Each step can be undone."
              items={[
                { id: 'backup', emoji: '💾', label: 'Take a backup' },
                { id: 'add', emoji: '➕', label: 'Add the new columns (optional, empty)' },
                { id: 'copy', emoji: '📋', label: 'Copy data into them, check the odd rows' },
                { id: 'release', emoji: '🚀', label: 'Release the app version that uses them' },
                { id: 'drop', emoji: '🧹', label: 'Later: remove the old column' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w3-migrations-q1',
          prompt: 'Why did the quick migration break the live app?',
          level: 2,
          concepts: ['migrations'],
          options: [
            { text: 'The database ran out of space', why: 'Space wasn’t the issue. The column the app depends on vanished.' },
            { text: 'It removed a column the running app still reads', correct: true, why: 'The app and the data changed at different moments. Safe migrations keep the old shape working until the new app is live.' },
            { text: 'SQL is unreliable', why: 'SQL did exactly what it was told — which is the danger.' },
            { text: 'Too many users were online', why: 'It would have broken with one user too. The order of changes was the problem.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-migrations-q2',
          context: 'Your AI agent: “I’ll rename the ‘company’ column to ‘organization’ directly in production. Quick fix!”',
          prompt: 'What do you say?',
          level: 3,
          concepts: ['migrations'],
          options: [
            { text: '“Great, go ahead.”', why: 'A rename is a remove-plus-add as far as the running app is concerned. Everything reading “company” breaks instantly.' },
            { text: '“Write it as a migration, test it on a copy, back up first, and keep the app working during the switch.”', correct: true, why: 'Migrations should be scripted, tested on staging, reversible and backed up. That turns a risky edit into a routine change.' },
            { text: '“Do it at 3 a.m. so nobody notices.”', why: 'Fewer users see the break, but data loss or a broken app at 3 a.m. is still broken — with nobody awake to fix it.' },
            { text: '“Never change the database.”', why: 'Your product has to evolve. The skill is changing it safely, not freezing it.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-migrations-q3',
          prompt: 'Why keep the old name column for a week after app v2 is released?',
          level: 4,
          concepts: ['migrations'],
          options: [
            { text: 'Deleting columns is slow', why: 'Dropping a column is usually quick. The reason is safety, not speed.' },
            { text: 'So you can roll back to v1 if v2 has a bug', correct: true, why: 'If v2 misbehaves, v1 still works because its column still exists. Removing it too soon burns your escape route.' },
            { text: 'Databases require a waiting period', why: 'There’s no such rule — it’s a deliberate choice teams make.' },
            { text: 'To save storage costs', why: 'Keeping an extra column costs a little more storage, not less.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Most scary data-loss stories are careless migrations. Ask: “Is there a backup, and has this run on a copy of real data?”',
            'Real data is messy — single names, odd formats, blanks. Budget time for the 2% of rows that don’t fit.',
            'Ask for migrations in small, reversible steps. “Can we undo this?” should always have a yes.',
          ],
        },
      ],
    },
    {
      id: 'w3-files',
      title: 'Files vs. data',
      subtitle: 'Where uploads really live — and how they leak.',
      minutes: 6,
      concepts: ['file-storage', 'bucket-access'],
      unlocks: ['storage'],
      steps: [
        {
          kind: 'concept',
          emoji: '🗂️',
          title: 'Big files go in a bucket',
          what: 'Photos, PDFs and videos live in file storage — a “bucket” built for large files. The database keeps a small row that says who the file belongs to and where it is.',
          why: 'Databases are great at small, structured facts and expensive for big blobs. Buckets are cheap and huge — but have none of the database’s structure.',
        },
        {
          kind: 'widget',
          title: 'Upload Maria’s passport',
          instruction: 'Upload a file, then see who can open it with the bucket public and private.',
          render: ({ done }) => <FileLab onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Database or bucket?',
          instruction: 'Tap each item, then tap where it should be stored.',
          render: ({ done }) => (
            <Categorize
              onDone={done}
              buckets={[
                { id: 'db', label: 'Database', emoji: '🗄️' },
                { id: 'files', label: 'File storage', emoji: '🗂️' },
              ]}
              items={[
                { id: 'photo', label: 'A profile photo', bucket: 'files', why: 'A big binary file. The database stores only its location.' },
                { id: 'email', label: 'A user’s email address', bucket: 'db', why: 'A small structured fact you search and filter on.' },
                { id: 'pdf', label: 'An uploaded insurance PDF', bucket: 'files', why: 'Large files belong in a bucket.' },
                { id: 'pointer', label: 'Which contact a PDF belongs to', bucket: 'db', why: 'That’s the pointer row: who owns it and its file key.' },
                { id: 'video', label: 'A training video', bucket: 'files', why: 'Huge. Buckets (often with a CDN in front) are built for this.' },
                { id: 'price', label: 'A plan’s monthly price', bucket: 'db', why: 'A small fact the backend needs for rules and billing.' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w3-files-q1',
          prompt: 'A user uploads a profile photo. What does the database usually store?',
          level: 2,
          concepts: ['file-storage'],
          options: [
            { text: 'The photo itself', why: 'Possible, but slow and expensive. Big files belong in file storage.' },
            { text: 'A pointer: who it belongs to and where the file lives', correct: true, why: 'The database keeps a small row (owner, file key, size). The bytes sit in the bucket.' },
            { text: 'Nothing — files and data are unrelated', why: 'Without a database row, the app wouldn’t know which photo belongs to whom.' },
            { text: 'A description of the photo', why: 'Some apps store a caption, but the key thing stored is where the file is.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-files-q2',
          context: 'Your agent set up uploads: “Files go in a public bucket so the links just work.” Users upload ID documents.',
          prompt: 'What should you ask for?',
          level: 3,
          concepts: ['bucket-access', 'file-storage'],
          options: [
            { text: 'Nothing — the links are long and random', why: 'Random links still leak: forwarded emails, logs, browser history. Public means anyone holding the link.' },
            { text: 'A private bucket, with the app handing out short-lived signed links after checking permission', correct: true, why: 'The app checks who’s asking, then gives a link that expires in minutes. A leaked link quickly becomes useless.' },
            { text: 'Rename the files to something boring', why: 'Obscure names don’t stop someone who has the link.' },
            { text: 'Stop accepting uploads', why: 'You can store sensitive files safely. Private buckets with signed links are the standard pattern.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w3-files-q3',
          context: 'A customer deletes their account. Their database rows are removed.',
          prompt: 'What might you have forgotten?',
          level: 3,
          concepts: ['file-storage', 'bucket-access'],
          options: [
            { text: 'Nothing — deleting rows deletes everything', why: 'Rows and files live in different systems. Deleting the pointer leaves the file behind.' },
            { text: 'Their uploaded files are still in the bucket', correct: true, why: 'Orphaned files keep costing money, and may still be reachable. Privacy laws expect them gone too.' },
            { text: 'Their DNS records', why: 'Customers don’t have DNS records in your app. Their files, though…' },
            { text: 'Their password must be emailed to them', why: 'Never email passwords. The forgotten piece here is their files.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Public-bucket leaks are among the most common, most embarrassing breaches. Ask: “Is every bucket private unless it truly must be public?”',
            '“Delete my data” must include files, not just rows. Check that account deletion cleans up storage.',
            'Storage is cheap per gigabyte but grows forever. Ask what you keep, for how long, and what it costs.',
          ],
        },
      ],
    },
  ],
}

export default world
