import type { World } from '../../lib/types'
import { FlowSim } from '../../widgets/FlowSim'
import { ArchMap } from '../../components/ArchMap'

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
  ],
}

export default world
