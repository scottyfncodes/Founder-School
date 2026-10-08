import type { World } from '../../lib/types'
import { FlowSim } from '../../widgets/FlowSim'
import { ArchMap } from '../../components/ArchMap'
import { Categorize } from '../../widgets/Categorize'
import { Matcher } from '../../widgets/Matcher'
import { FrontBackLab } from '../../widgets/FrontBackLab'
import { CodeReader, PackageTree } from '../../widgets/PackageTree'
import { CacheLab, StateLab } from '../../widgets/StateLab'

const STACK = [
  { id: 'user', label: 'You', emoji: '🧑', note: 'Taps “Save”' },
  { id: 'phone', label: 'Phone', emoji: '📱', note: 'Turns the tap into a signal' },
  { id: 'browser', label: 'Browser', emoji: '🧭', note: 'Runs the app’s code' },
  { id: 'internet', label: 'Internet', emoji: '🌐', note: 'Carries the message' },
  { id: 'frontend', label: 'Frontend', emoji: '🎨', note: 'The screens you see' },
  { id: 'api', label: 'API', emoji: '🚪', note: 'The service window' },
  { id: 'backend', label: 'Backend', emoji: '⚙️', note: 'Rules & decisions' },
  { id: 'database', label: 'Database', emoji: '🗄️', note: 'Permanent memory' },
]

const world: World = {
  id: 'w1',
  num: 1,
  title: 'How Software Works',
  tagline: 'What actually happens when you tap a button.',
  emoji: '🧭',
  color: '#3b5bdb',
  skill: 'tech',
  concepts: [
    { id: 'web-stack', name: 'The web app stack' },
    { id: 'frontend', name: 'Frontend' },
    { id: 'backend', name: 'Backend' },
    { id: 'database-intro', name: 'Database (the idea)' },
    { id: 'trust-device', name: 'Never trust the device' },
    { id: 'code-languages', name: 'Code, languages & frameworks' },
    { id: 'packages', name: 'Packages & dependencies' },
    { id: 'memory-storage', name: 'Memory vs. storage' },
    { id: 'caching', name: 'Caching' },
  ],
  lessons: [
    {
      id: 'w1-machine',
      title: 'How does a web app actually work?',
      subtitle: 'Follow one tap all the way to the database and back.',
      minutes: 6,
      concepts: ['web-stack', 'frontend', 'backend', 'database-intro'],
      unlocks: ['user', 'phone', 'browser', 'internet', 'frontend', 'api', 'backend', 'database'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏃',
          title: 'A web app is a relay race',
          what: 'When you tap a button, a message is passed hand to hand — phone, browser, internet, your app’s servers, the database — and an answer is passed all the way back.',
          why: 'No single computer does everything. Your phone is good at showing things; servers are good at remembering things and enforcing rules. Splitting the work is what lets millions of people share one app.',
        },
        {
          kind: 'widget',
          title: 'Follow one tap',
          instruction: 'Press each button and watch the message travel. Read the log underneath.',
          render: ({ done }) => (
            <FlowSim
              nodes={STACK}
              onDone={done}
              required={['save', 'offline']}
              scenarios={[
                {
                  id: 'save',
                  label: 'Save a contact',
                  hops: [
                    { at: 'user', say: 'Taps “Save” on “Maria Lopez”', tone: 'req' },
                    { at: 'phone', say: 'Registers the touch', tone: 'req', hold: 600 },
                    { at: 'browser', say: 'Runs the app’s code for the Save button', tone: 'req', hold: 700 },
                    { at: 'internet', say: 'Carries “save Maria” to the app’s servers', tone: 'req' },
                    { at: 'frontend', say: 'Packages the form into a request', tone: 'req', hold: 700 },
                    { at: 'api', say: '“POST /contacts — please save Maria”', tone: 'req' },
                    { at: 'backend', say: 'Checks: logged in? allowed? valid email?', tone: 'req' },
                    { at: 'database', say: 'Stores Maria as contact #482', tone: 'res', hold: 1100 },
                    { at: 'backend', say: '“Saved. Her ID is 482.”', tone: 'res', hold: 600 },
                    { at: 'api', say: 'Responds: 201 Created', tone: 'res', hold: 600 },
                    { at: 'frontend', say: 'Shows a green “Saved ✓”', tone: 'res', hold: 600 },
                    { at: 'user', say: 'Sees the checkmark. Total time: ~0.3 seconds.', tone: 'res' },
                  ],
                  screen: '✅ Maria Lopez saved',
                  result: {
                    tone: 'good',
                    text: 'Eight hand-offs out, back again — in a fraction of a second. Every box you saw is something you pay for, and something that can break.',
                  },
                },
                {
                  id: 'offline',
                  label: 'Save — but Wi‑Fi drops',
                  danger: true,
                  hops: [
                    { at: 'user', say: 'Taps “Save”', tone: 'req' },
                    { at: 'phone', say: 'Registers the touch', tone: 'req', hold: 600 },
                    { at: 'browser', say: 'Runs the Save code', tone: 'req', hold: 600 },
                    { at: 'internet', say: 'No connection — the message never leaves', tone: 'err', status: 'fail', hold: 1300 },
                    { at: 'browser', say: 'Waits… gives up after a timeout', tone: 'err', status: 'warn' },
                    { at: 'user', say: 'Sees a spinner, then an error', tone: 'err', status: 'fail' },
                  ],
                  screen: '⚠️ Couldn’t save. Check your connection and try again.',
                  result: {
                    tone: 'warn',
                    text: 'The database never heard about Maria. A good app tells the user clearly and keeps what they typed so they can retry — a bad one silently loses it.',
                  },
                },
              ]}
            />
          ),
        },
        {
          kind: 'points',
          title: 'The cast of characters',
          points: [
            { term: '🎨 Frontend', text: 'Everything you see and touch. It runs on the user’s device, inside the browser.' },
            { term: '🚪 API', text: 'The service window where the frontend asks the backend for things.' },
            { term: '⚙️ Backend', text: 'Code on your servers that applies the rules: who’s allowed, what’s valid, what to save.' },
            { term: '🗄️ Database', text: 'Permanent, organized memory. It still has your data after everyone closes the app.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Your first architecture map',
          instruction: 'Tap at least 4 boxes. Notice what goes in, what comes out, and what happens if each one fails.',
          render: ({ done }) => (
            <ArchMap
              revealAll
              only={['user', 'phone', 'browser', 'internet', 'frontend', 'api', 'backend', 'database']}
              onExplored={(n) => n >= 4 && done()}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w1-machine-q1',
          prompt: 'You close the app, restart your phone, and open it again. Maria is still in your contacts. Which box remembered her?',
          level: 2,
          concepts: ['database-intro', 'web-stack'],
          options: [
            { text: 'The frontend', why: 'The frontend is rebuilt from scratch every time you open the app. It only shows data — it doesn’t keep it.' },
            { text: 'The browser', why: 'Browsers can hold small temporary bits, but they get wiped, and they’re only on one device. Your data must survive a lost phone.' },
            { text: 'The database', correct: true, why: 'The database is the app’s permanent memory. It lives on servers, not your phone, which is why you can log in from a new device and everything is there.' },
            { text: 'The API', why: 'The API passes requests and responses back and forth. Like a waiter, it carries the order — it doesn’t store the food.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-machine-q2',
          context: 'Your developer says: “The frontend is fine. The backend is crashing on save.”',
          prompt: 'What is the user most likely experiencing?',
          level: 3,
          concepts: ['frontend', 'backend', 'web-stack'],
          options: [
            { text: 'The app won’t open at all', why: 'If the frontend is fine, the screens still load. The problem appears when the app needs the backend.' },
            { text: 'Screens look normal, but saving fails with an error', correct: true, why: 'The frontend (what you see) works, so the app looks healthy — until you do something that needs the backend. That’s why “it looks fine” and “it works” are different claims.' },
            { text: 'Their phone is slow', why: 'A backend crash happens on your servers. The user’s phone has nothing to do with it.' },
            { text: 'Nothing — backend problems are invisible to users', why: 'Backend problems are very visible: they show up as failed saves, missing data and error messages.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'When something breaks, the first useful question is “which box?” — it turns panic into a search.',
            'Each box is a cost line: hosting for the backend, a database plan, bandwidth for the internet hops.',
            'Anything that must be enforced (prices, permissions, limits) belongs in the backend. The frontend is on the user’s device, and users can change it.',
          ],
        },
      ],
    },
    {
      id: 'w1-front-back',
      title: 'Frontend vs. backend',
      subtitle: 'What runs on their phone, what runs on your servers — and why it matters.',
      minutes: 7,
      concepts: ['frontend', 'backend', 'trust-device'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏠',
          title: 'Two halves of every app',
          what: 'The frontend is the code your customer downloads and runs on their own device. The backend is code that runs on servers you control.',
          why: 'Showing things fast needs to happen on the device. Keeping secrets, money and rules safe needs a place the customer can’t touch.',
        },
        {
          kind: 'widget',
          title: 'Change the price yourself',
          instruction: 'Edit the price in the page and pay — once with each setting. Watch what your server does.',
          render: ({ done }) => <FrontBackLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The rule of thumb',
          points: [
            { term: '🎨 Frontend = convenience', text: 'Layout, animations, instant hints like “that email looks wrong”. It makes the app pleasant.' },
            { term: '⚙️ Backend = authority', text: 'Prices, permissions, limits, secrets. Anything that must be true no matter who is asking.' },
            { term: '🙅 Never trust the device', text: 'Anything on the user’s phone can be read or changed by a curious user. Treat what it sends as a request, not a fact.' },
            { term: '🔁 Check twice', text: 'Good apps check a form in the frontend (for speed) and again in the backend (for safety).' },
          ],
        },
        {
          kind: 'widget',
          title: 'Where does it belong?',
          instruction: 'Tap each item, then tap where it should run.',
          render: ({ done }) => (
            <Categorize
              onDone={done}
              buckets={[
                { id: 'front', label: 'Frontend', emoji: '🎨' },
                { id: 'back', label: 'Backend', emoji: '⚙️' },
              ]}
              items={[
                { id: 'colors', label: 'Button colors & layout', bucket: 'front', why: 'Purely visual. If a user changes it, only their own screen looks different.' },
                { id: 'password', label: 'Checking a password', bucket: 'back', why: 'If the device did it, anyone could skip the check.' },
                { id: 'price', label: 'Calculating the final price', bucket: 'back', why: 'You just saw why: the device can say any number it likes.' },
                { id: 'hint', label: '“Email looks invalid” hint while typing', bucket: 'front', why: 'Instant feedback is a frontend job. The backend still re-checks when it arrives.' },
                { id: 'hide', label: 'Hiding the Admin button from normal users', bucket: 'front', why: 'Hiding is cosmetic. The backend must still refuse admin actions from non-admins.' },
                { id: 'key', label: 'The secret key for your payment provider', bucket: 'back', why: 'Anything shipped to the frontend can be read by anyone. Secrets stay on servers.' },
                { id: 'email', label: 'Sending the welcome email', bucket: 'back', why: 'Sending needs your email account’s credentials, which must never reach the device.' },
                { id: 'anim', label: 'The little bounce when a card opens', bucket: 'front', why: 'Animation runs best right on the device, with no trip to the server.' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w1-front-back-q1',
          prompt: 'Why was the $1 purchase possible when the price lived in the frontend?',
          level: 2,
          concepts: ['frontend', 'trust-device'],
          options: [
            { text: 'The frontend code had a typo', why: 'No typo needed. The code worked exactly as written — it just ran on a device the customer controls.' },
            { text: 'Frontend code runs on the customer’s device, so they can change it', correct: true, why: 'Exactly. The customer’s browser is their territory. Whatever it sends, your server should treat as a request, not a fact.' },
            { text: 'The customer hacked your servers', why: 'They never touched your servers. They edited a page on their own phone — something any user can do.' },
            { text: 'Payments always have bugs', why: 'This isn’t bad luck; it’s a design mistake. Put the price check on the backend and it disappears.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-front-back-q2',
          context: 'Your AI agent says: “Done! Free users can no longer export data — I hid the Export button for them.”',
          prompt: 'What should you ask next?',
          level: 3,
          concepts: ['backend', 'trust-device', 'frontend'],
          options: [
            { text: 'Nothing — if the button is hidden, they can’t export', why: 'Hiding a button is a frontend change. A curious user can still call the export API directly.' },
            { text: '“Does the backend also refuse exports from free users?”', correct: true, why: 'This is the real question. The button is decoration; the backend check is the lock. You want both.' },
            { text: '“Can you make the button grey instead?”', why: 'Still cosmetic. Grey, hidden or missing, the frontend can be bypassed.' },
            { text: '“Can you move the button to settings?”', why: 'Moving it changes where people look, not what they’re allowed to do.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-front-back-q3',
          prompt: 'Your signup form already checks the email format in the frontend. Should the backend check it again?',
          level: 4,
          concepts: ['backend', 'frontend'],
          options: [
            { text: 'No — checking twice is wasted work', why: 'The frontend check can be skipped by anyone talking to your API directly, so it isn’t enough on its own.' },
            { text: 'Yes — the frontend check is for speed, the backend check is for safety', correct: true, why: 'Frontend checks give instant feedback; backend checks are the ones you can rely on. Doing both is standard practice.' },
            { text: 'Only if the app is popular', why: 'Bad data and abuse don’t wait for popularity. Backend checks matter from the first user.' },
            { text: 'Remove the frontend check and keep only the backend', why: 'That’s safe but annoying: users would only learn about typos after submitting. Keep both.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Pricing, plan limits and permissions must be enforced on the backend — or they are suggestions.',
            '“I hid the button” is not security. Ask: “What does the server do if someone calls it anyway?”',
            'Frontend bugs usually look ugly; backend bugs usually cost money or leak data. Prioritize accordingly.',
          ],
        },
      ],
    },
    {
      id: 'w1-code',
      title: 'What code actually is',
      subtitle: 'Languages, frameworks, packages — and the code you didn’t write.',
      minutes: 6,
      concepts: ['code-languages', 'packages'],
      steps: [
        {
          kind: 'concept',
          emoji: '📜',
          title: 'Code is a very precise recipe',
          what: 'Code is written instructions a computer follows exactly, step by step. A programming language (TypeScript, Python, Swift…) is the vocabulary those instructions are written in.',
          why: 'Computers do exactly what they’re told and nothing more. Languages let humans — and AI agents — write those instructions in something closer to English.',
        },
        {
          kind: 'widget',
          title: 'Read real code',
          instruction: 'Tap each line of this Save button’s code to see what it means in plain English.',
          render: ({ done }) => <CodeReader onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Name the building blocks',
          instruction: 'Tap a term, then tap what it means.',
          render: ({ done }) => (
            <Matcher
              onDone={done}
              pairs={[
                { id: 'lang', left: 'Language', right: 'The vocabulary code is written in, like TypeScript or Python' },
                { id: 'fw', left: 'Framework', right: 'A ready-made structure your app lives inside, like React' },
                { id: 'lib', left: 'Library', right: 'A toolbox of code you call when needed, like a date formatter' },
                { id: 'pkg', left: 'Package', right: 'A library bundled so it installs with one command' },
                { id: 'dep', left: 'Dependency', right: 'Any outside code your app needs in order to run' },
              ]}
            />
          ),
        },
        {
          kind: 'widget',
          title: 'Most of your app isn’t yours',
          instruction: 'Install at least 3 packages and watch the numbers. Then trigger the security alert and fix it.',
          render: ({ done }) => <PackageTree onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w1-code-q1',
          prompt: 'A security alert names a package you’ve never heard of. How can it be in your app?',
          level: 2,
          concepts: ['packages'],
          options: [
            { text: 'Someone broke in and added it', why: 'Possible in theory, but far less likely than the everyday explanation: dependencies bring their own dependencies.' },
            { text: 'A package you chose depends on it', correct: true, why: 'Right. Each package you install can pull in dozens more. They all ship inside your app and are your responsibility.' },
            { text: 'The alert is a mistake — you only run code you wrote', why: 'Most of what ships in a modern app is borrowed code, often 95%+ of it.' },
            { text: 'Your programming language includes it automatically', why: 'Languages come with a small built-in toolkit, but alerts like this are almost always about installed packages.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-code-q2',
          context: 'Your AI agent wants to add a 40,000-line charting package to draw one simple bar chart.',
          prompt: 'What’s the best founder response?',
          level: 3,
          concepts: ['packages', 'code-languages'],
          options: [
            { text: 'Always approve — free code is free', why: 'Every package adds weight, update work and security risk. “Free” code has an ongoing cost.' },
            { text: 'Never use packages; write everything ourselves', why: 'That would be slow and often less safe. Well-maintained packages are usually better than home-made versions.' },
            { text: 'Ask if it’s well maintained, and whether something smaller would do', correct: true, why: 'Good packages save months. The trade-off is size and risk, so prefer popular, maintained, right-sized ones.' },
            { text: 'Ask the agent to rewrite the app in another language', why: 'Switching languages doesn’t solve this — every language has packages and the same trade-offs.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-code-q3',
          prompt: 'Your developer says the app is “a React app written in TypeScript”. What does that tell you?',
          level: 2,
          concepts: ['code-languages'],
          options: [
            { text: 'TypeScript is the framework and React is the language', why: 'It’s the other way around: TypeScript is the language, React is the framework built on it.' },
            { text: 'TypeScript is the language; React is the framework that structures the screens', correct: true, why: 'Yes. Language = the vocabulary. Framework = the ready-made structure the app is built inside.' },
            { text: 'It’s a mobile app only', why: 'React runs in web browsers. (React Native is the cousin for mobile apps.)' },
            { text: 'Nothing useful', why: 'It tells you quite a lot — like which skills a future hire needs and which packages you can use.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Your language and framework decide who you can hire and which tools your AI agent knows best. Boring and popular is a feature.',
            'Every package is a supplier. Keep them updated — most real-world breaches use old, known flaws.',
            'Ask for automated dependency alerts (e.g. GitHub Dependabot). They’re free and catch the “tiny-color” problem for you.',
          ],
        },
      ],
    },
    {
      id: 'w1-state',
      title: 'Where things live',
      subtitle: 'Memory, device storage, the server — and why refresh eats your draft.',
      minutes: 8,
      concepts: ['memory-storage', 'caching', 'database-intro'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧠',
          title: 'Short-term vs. long-term memory',
          what: 'Memory is where an app keeps things while it’s running — fast, but wiped on refresh or close. Storage (on the device or on a server) keeps things after the app closes.',
          why: 'Memory is fast and cheap but forgetful. Storage is slower but permanent. Every app juggles both.',
        },
        {
          kind: 'widget',
          title: 'Where is my note?',
          instruction: 'Type a draft, then try Refresh, Save, and Open on laptop. Watch the three boxes underneath.',
          render: ({ done }) => <StateLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Four places data can live',
          points: [
            { term: '🧠 Memory', text: 'What the open app is holding right now. Gone on refresh, close or crash.' },
            { term: '💾 Device storage', text: 'Saved inside one browser on one device. Survives refresh; lost if the user clears data or switches device.' },
            { term: '🗄️ Server database', text: 'The source of truth. Same data on every device, survives everything except your own mistakes.' },
            { term: '⚡ Cache', text: 'A quick copy kept nearby so you don’t have to ask again. Fast — but can be out of date.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Fast copies go stale',
          instruction: 'Open the contact twice, have Alex rename her, open again — then pull to refresh.',
          render: ({ done }) => <CacheLab onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w1-state-q1',
          prompt: 'A customer typed a long message, the page refreshed, and it vanished. Where did the message live?',
          level: 2,
          concepts: ['memory-storage'],
          options: [
            { text: 'In the server database', why: 'If it had reached the database, the refresh would have loaded it back.' },
            { text: 'Only in memory', correct: true, why: 'Unsaved text lives in memory, and a refresh wipes memory. Autosaving drafts to device storage would have saved it.' },
            { text: 'In the cache', why: 'A cache holds copies of things that already exist somewhere else. The draft never existed anywhere else.' },
            { text: 'In device storage', why: 'Device storage survives refresh — if it had been there, it would have come back.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-state-q2',
          context: 'A customer says: “I changed my company name, but the dashboard still shows the old one.”',
          prompt: 'What’s the most likely explanation?',
          level: 3,
          concepts: ['caching', 'memory-storage'],
          options: [
            { text: 'The change was never saved', why: 'Possible, but if other screens show the new name, the save worked. Something is showing an old copy.' },
            { text: 'The dashboard is showing a cached copy', correct: true, why: 'Classic stale cache. Ask your developer how long things are cached and whether saving clears the cache.' },
            { text: 'The database is corrupted', why: 'Very unlikely, and a dramatic conclusion. Check the boring explanation (caching) first.' },
            { text: 'The customer’s phone is broken', why: 'Phones don’t keep old company names by themselves. An app cache is doing that.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w1-state-q3',
          prompt: 'You want users to start a report on their phone and finish it on their laptop. Where must the draft be saved?',
          level: 3,
          concepts: ['memory-storage', 'database-intro'],
          options: [
            { text: 'In memory', why: 'Memory is wiped when the app closes, and it never leaves the phone.' },
            { text: 'In the phone’s browser storage', why: 'That survives a refresh, but it lives on the phone only — the laptop can’t see it.' },
            { text: 'On the server, in the database', correct: true, why: 'Only the server is shared by every device. Cross-device drafts mean saving drafts to the backend.' },
            { text: 'In a cache', why: 'A cache is a copy of data that lives elsewhere. You still need the “elsewhere” — the server.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Lost work is the fastest way to lose a user’s trust. Ask: “What happens to unsaved input if the page refreshes?”',
            '“Works on every device” is a backend feature: it means storing things on the server, which costs money and design effort.',
            'Caching makes apps fast and cheap — and causes “I changed it but it didn’t change” bugs. Know where your app caches.',
          ],
        },
      ],
    },
  ],
}

export default world
