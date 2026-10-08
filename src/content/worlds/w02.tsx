import type { World } from '../../lib/types'
import { Matcher } from '../../widgets/Matcher'
import { RevealCards } from '../../widgets/RevealCards'
import { RequestLab, UrlAnatomy } from '../../widgets/RequestLab'
import { ApiLab } from '../../widgets/ApiLab'
import { DnsLab } from '../../widgets/DnsLab'
import { SpeedLab } from '../../widgets/SpeedLab'

const world: World = {
  id: 'w2',
  num: 2,
  title: 'The Web',
  tagline: 'Requests, APIs, domains and speed.',
  emoji: '🌐',
  color: '#1c7ed6',
  skill: 'tech',
  concepts: [
    { id: 'request-response', name: 'Requests & responses' },
    { id: 'urls-methods', name: 'URLs & HTTP methods' },
    { id: 'status-codes', name: 'Status codes' },
    { id: 'https', name: 'HTTPS' },
    { id: 'api', name: 'APIs' },
    { id: 'graceful-failure', name: 'Failing gracefully' },
    { id: 'dns', name: 'Domains & DNS' },
    { id: 'latency', name: 'Latency & round trips' },
    { id: 'cdn-caching', name: 'CDNs & caching' },
  ],
  lessons: [
    {
      id: 'w2-request',
      title: 'Requests & responses',
      subtitle: 'Every tap is a little letter to a server — and a reply.',
      minutes: 7,
      concepts: ['request-response', 'urls-methods', 'status-codes', 'https'],
      steps: [
        {
          kind: 'concept',
          emoji: '✉️',
          title: 'The web is letters and replies',
          what: 'A request is a message your app sends to a server: “what I want, where, and who I am.” A response is the reply: a status code plus the answer.',
          why: 'It’s a simple, universal format. Any app can talk to any server, in any language, on any device.',
        },
        {
          kind: 'widget',
          title: 'Read an address',
          instruction: 'Tap each part of this URL to see what it tells the server.',
          render: ({ done }) => <UrlAnatomy onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The verbs: HTTP methods',
          points: [
            { term: 'GET', text: 'Read something. “Show me contact 482.” Should never change anything.' },
            { term: 'POST', text: 'Create something. “Save this new contact.”' },
            { term: 'PUT / PATCH', text: 'Update something. “Change Maria’s phone number.”' },
            { term: 'DELETE', text: 'Remove something. “Delete contact 482.”' },
          ],
        },
        {
          kind: 'widget',
          title: 'Send requests, collect status codes',
          instruction: 'Mix the request, the user and the conditions. Find at least 5 different status codes.',
          render: ({ done }) => <RequestLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Status codes in one glance',
          points: [
            { term: '2xx — it worked', text: '200 OK, 201 Created.' },
            { term: '4xx — the request has a problem', text: '401 “who are you?”, 403 “you’re not allowed”, 404 “that doesn’t exist”.' },
            { term: '5xx — the server has a problem', text: '500 means your code broke. That one is always on you, never the user.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-request-q1',
          prompt: 'Alex is logged in and tries to open the admin page. Which status code should he get?',
          level: 2,
          concepts: ['status-codes'],
          options: [
            { text: '401 Unauthorized', why: '401 means “I don’t know who you are.” The server does know it’s Alex — so this isn’t the right one.' },
            { text: '403 Forbidden', correct: true, why: 'The server knows exactly who he is, and he isn’t allowed. 403 = known, but not permitted.' },
            { text: '404 Not Found', why: 'Some apps do this to hide admin pages exist, but the honest code for “not allowed” is 403.' },
            { text: '500 Internal Server Error', why: 'Nothing broke. The server worked perfectly — it said no on purpose.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-request-q2',
          context: 'Your error dashboard shows hundreds of 500 errors since this morning’s release. 404s are flat.',
          prompt: 'What does that tell you?',
          level: 3,
          concepts: ['status-codes', 'request-response'],
          options: [
            { text: 'Users are typing wrong addresses', why: 'That would show up as 404s, which haven’t changed.' },
            { text: 'Something in the release is crashing on the server', correct: true, why: '5xx errors are your code failing. A spike right after a release strongly suggests the release — consider rolling back.' },
            { text: 'Users forgot their passwords', why: 'Login problems show as 401s, not 500s.' },
            { text: 'It’s normal background noise', why: 'A sudden spike of 500s after a release is a signal, not noise. Somebody should look now.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-request-q3',
          prompt: 'Why does it matter that your app uses HTTPS, not plain HTTP?',
          level: 2,
          concepts: ['https', 'request-response'],
          options: [
            { text: 'HTTPS makes pages load faster', why: 'Modern HTTPS is roughly as fast, but speed isn’t the point. Privacy is.' },
            { text: 'Without it, anyone on the same network can read requests — including login cookies', correct: true, why: 'Plain HTTP is a postcard. HTTPS is a sealed envelope. Without it, café Wi‑Fi strangers can read and hijack sessions.' },
            { text: 'It hides which website you visit', why: 'HTTPS still reveals the site name. It hides what you send and receive.' },
            { text: 'It’s only needed on payment pages', why: 'Any page with a login cookie is worth stealing. Today, every page should be HTTPS.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-request-q4',
          context: 'An email contains a link: app.acme.com/contacts/482/delete. Clicking it deletes the contact.',
          prompt: 'Why would an engineer wince at this?',
          level: 4,
          concepts: ['urls-methods'],
          options: [
            { text: 'The URL is too long', why: 'Length isn’t the issue. What clicking it does is.' },
            { text: 'Opening a link is a GET — and GETs should never change data', correct: true, why: 'Link previewers, browsers and email scanners open links automatically. A GET that deletes means contacts vanish on their own. Deleting should be a DELETE request.' },
            { text: 'Contact IDs should be words, not numbers', why: 'Numeric IDs are fine. The problem is the method, not the ID.' },
            { text: 'It should use HTTP instead of HTTPS', why: 'HTTPS is always the right choice. The problem is using a read-only verb for a destructive action.' },
          ],
        },
        {
          kind: 'care',
          points: [
            '401/403/404/500 tell you who to blame: the user, your rules, a bad link, or your code. Ask for errors grouped by code.',
            'A spike in 5xx after a release usually means “roll back first, investigate second.”',
            'Never put secrets or personal data in URLs — they get logged, bookmarked and shared.',
          ],
        },
      ],
    },
    {
      id: 'w2-api',
      title: 'APIs: how apps talk',
      subtitle: 'Load my contacts — and what happens when the database says nothing.',
      minutes: 9,
      concepts: ['api', 'graceful-failure', 'request-response'],
      steps: [
        {
          kind: 'concept',
          emoji: '🚪',
          title: 'The service window',
          what: 'An API is the set of requests your backend agrees to answer — like a restaurant’s service window with a fixed menu. The app orders; the kitchen stays out of sight.',
          why: 'It keeps the database private and the rules in one place. Your website, phone app and partners can all use the same window.',
        },
        {
          kind: 'widget',
          title: 'Load my contacts',
          instruction: 'Load your contacts, then break the database and decide what the app should do.',
          render: ({ done }) => <ApiLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'API words you’ll hear',
          points: [
            { term: 'Endpoint', text: 'One item on the menu, like GET /contacts. Each has its own rules.' },
            { term: 'JSON', text: 'The plain-text format most APIs reply in: {"name": "Maria Lopez"}.' },
            { term: 'API key / token', text: 'The pass that says who is asking. Treat it like a password.' },
            { term: 'Timeout', text: 'How long the app waits before giving up. Without one, it can spin forever.' },
          ],
        },
        {
          kind: 'widget',
          title: 'APIs are everywhere',
          instruction: 'Tap each card. Your app talks to other companies’ APIs the same way.',
          render: ({ done }) => (
            <RevealCards
              onDone={done}
              cards={[
                { id: 'own', emoji: '🗂️', title: 'Your own API', body: 'Your app asks: “contacts for user 7”. Your backend answers from your database.', tone: 'info' },
                { id: 'stripe', emoji: '💳', title: 'Payments API', body: 'You send: “charge $29 to this card token”. Stripe replies: “paid” or “declined”.', tone: 'info' },
                { id: 'maps', emoji: '🗺️', title: 'Maps API', body: 'You send an address. You get coordinates back — and a bill per thousand requests.', tone: 'info' },
                { id: 'ai', emoji: '🤖', title: 'AI model API', body: 'You send a prompt. You get text back. It can be slow, rate-limited, or down.', tone: 'warn' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w2-api-q1',
          prompt: 'Why doesn’t the phone app just connect to the database directly?',
          level: 2,
          concepts: ['api'],
          options: [
            { text: 'Phones can’t connect to databases', why: 'Technically they could. The problem is that they shouldn’t.' },
            { text: 'Then anyone with the app could read or change everyone’s data', correct: true, why: 'The database password would have to ship inside the app, where anyone can dig it out. The API is the guarded window.' },
            { text: 'APIs make the database bigger', why: 'APIs don’t change the database’s size — they control who can ask it what.' },
            { text: 'It would be too fast', why: 'Speed isn’t the issue. Safety and control are.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-api-q2',
          context: 'During checkout, your payments provider’s API doesn’t answer for 30 seconds.',
          prompt: 'What should your app do?',
          level: 3,
          concepts: ['graceful-failure', 'api'],
          options: [
            { text: 'Show “Order complete” and sort it out later', why: 'You’d ship products nobody paid for and confuse customers when charges fail.' },
            { text: 'Charge again automatically until it works', why: 'Dangerous: the first charge may have succeeded silently. Blind retries on payments cause double charges.' },
            { text: 'Say payment couldn’t be confirmed, keep the cart, and check the status before retrying', correct: true, why: 'Honest and safe. Keep the user’s work, avoid double charges, and let them try again once you know what happened.' },
            { text: 'Empty the cart so they start fresh', why: 'Punishes the customer for your provider’s outage — and loses the sale.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-api-q3',
          context: 'Your engineer suggests: “If the database is down, show the contacts from the last successful load, marked ‘offline copy’.”',
          prompt: 'What’s the honest trade-off?',
          level: 4,
          concepts: ['graceful-failure', 'api'],
          options: [
            { text: 'No downside — always do this', why: 'There is a downside: the copy may be out of date, and edits made against it need careful handling.' },
            { text: 'Users keep working, but may see stale data — so it must be clearly labelled and edits handled carefully', correct: true, why: 'That’s the real trade-off. Showing older data clearly marked is far better than lying (an empty list) or crashing.' },
            { text: 'It’s the same as option C, pretending', why: 'Option C showed an empty list — a lie. A labelled offline copy is true, just possibly old.' },
            { text: 'It makes the database come back faster', why: 'The fallback changes what users see, not how fast the database recovers.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Every API call can fail. Ask your agent: “What does the user see when this fails?” — for every important screen.',
            'An honest error with Retry keeps trust. A fake empty screen burns it and hides outages from you.',
            'The APIs you use from other companies are dependencies with bills, limits and outages. Know which ones you rely on.',
          ],
        },
      ],
    },
    {
      id: 'w2-dns',
      title: 'Domains & DNS',
      subtitle: 'How a name becomes a server — and why your domain is a business asset.',
      minutes: 7,
      concepts: ['dns'],
      unlocks: ['dns'],
      steps: [
        {
          kind: 'concept',
          emoji: '📖',
          title: 'The internet’s phone book',
          what: 'Computers find each other by numeric addresses like 203.0.113.10. DNS is the phone book that turns a name like example.com into that number.',
          why: 'Names are memorable and can be re-pointed. You can move your app to a new server without customers learning a new address.',
        },
        {
          kind: 'widget',
          title: 'Look up a website',
          instruction: 'Type example.com and press Go. Then change the DNS record and look it up again.',
          render: ({ done }) => <DnsLab onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'The common DNS records',
          instruction: 'Match each record type to what it does.',
          render: ({ done }) => (
            <Matcher
              onDone={done}
              leftTitle="Record"
              pairs={[
                { id: 'a', left: 'A', right: 'Name → server address (the main one)' },
                { id: 'cname', left: 'CNAME', right: 'Name → another name (“www is an alias”)' },
                { id: 'mx', left: 'MX', right: 'Where email for this domain goes' },
                { id: 'txt', left: 'TXT', right: 'Notes that prove you own it (for Google, email services)' },
                { id: 'ns', left: 'NS', right: 'Which company’s DNS servers are in charge' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w2-dns-q1',
          prompt: 'You move your app to a new hosting company and update the DNS record. What changed?',
          level: 2,
          concepts: ['dns'],
          options: [
            { text: 'The app’s code and features', why: 'DNS doesn’t touch code. The same app now runs at a new address.' },
            { text: 'Where the name points — nothing else', correct: true, why: 'DNS only answers “which address?” The app, its data and its version are whatever is running at that address.' },
            { text: 'The domain name itself', why: 'The name stays the same — that’s the whole point.' },
            { text: 'The customers’ passwords', why: 'Passwords live in your database. DNS has nothing to do with them.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-dns-q2',
          context: 'Your domain was bought by a freelancer three years ago, on their personal registrar account. They’ve moved on.',
          prompt: 'What should you do?',
          level: 3,
          concepts: ['dns'],
          options: [
            { text: 'Nothing — the site works', why: 'It works until the card on their account expires, or they leave on bad terms. Then the site and email vanish.' },
            { text: 'Transfer the domain into a company-owned registrar account, with 2FA and auto-renew', correct: true, why: 'Whoever controls the registrar controls your website and email. It should belong to the company, not a person.' },
            { text: 'Buy a different domain just in case', why: 'Your customers, links and email use the current one. Get control of it instead.' },
            { text: 'Ask them for the server password', why: 'The server is a separate thing. The registrar account is what controls the name.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-dns-q3',
          context: 'Customers say your site is down. Your hosting dashboard shows the app healthy and running.',
          prompt: 'What’s a likely cause worth checking first?',
          level: 3,
          concepts: ['dns'],
          options: [
            { text: 'The database is full', why: 'Then the hosting dashboard would likely show errors. Here the app is healthy.' },
            { text: 'The domain expired or the DNS record was changed', correct: true, why: 'When the app is fine but unreachable by name, look at DNS and the registrar: renewal date and recent record edits.' },
            { text: 'Customers’ phones are out of date', why: 'Many customers at once on different phones points to something shared — like your domain.' },
            { text: 'The code has a bug', why: 'A bug usually shows up as errors from a reachable site, not a site that can’t be found at all.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Your domain is a critical asset: website, email and logins depend on it. Company-owned account, 2FA, auto-renew, two people with access.',
            'Moving hosts is mostly a DNS change — but changes roll out over the TTL. Lower it a day before a planned move.',
            'One wrong digit in a record takes you “down”. DNS edits deserve a second pair of eyes.',
          ],
        },
      ],
    },
    {
      id: 'w2-speed',
      title: 'Why apps feel fast or slow',
      subtitle: 'Distance, round trips, payload size — and copies close to your users.',
      minutes: 8,
      concepts: ['latency', 'cdn-caching'],
      unlocks: ['cdn'],
      steps: [
        {
          kind: 'concept',
          emoji: '🐢',
          title: 'Speed is mostly waiting',
          what: 'Latency is the time a message takes to travel to a server and back. Every round trip pays it, and far-away users pay it many times.',
          why: 'Light in cables is fast, but not instant: Sydney to Virginia and back takes about 0.3 s. Ask six times in a row and that’s nearly two seconds of waiting.',
        },
        {
          kind: 'widget',
          title: 'Make Sydney fast',
          instruction: 'Load the page as a Sydney visitor, then flip settings until it loads in under 1.5 seconds.',
          render: ({ done }) => <SpeedLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The four speed levers',
          points: [
            { term: '📦 Send less', text: 'Compress images and trim code. Bytes take time, especially on mobile.' },
            { term: '🔁 Ask fewer times', text: 'Combine requests. Each one in a row pays the full round trip.' },
            { term: '🛰️ Move closer (CDN)', text: 'A content delivery network keeps copies of your files in cities around the world.' },
            { term: '⚡ Remember (cache)', text: 'Keep copies on the device so repeat visits skip the trip — but plan for stale copies.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-speed-q1',
          prompt: 'Your app feels instant to you in Virginia, but Australian customers call it sluggish. Why?',
          level: 2,
          concepts: ['latency'],
          options: [
            { text: 'Australian phones are slower', why: 'Phones are the same everywhere. Distance to your server is what’s different.' },
            { text: 'Every round trip to your server takes far longer from Australia', correct: true, why: 'You’re next door to the server; they’re across the planet. Multiply that delay by every request in a row.' },
            { text: 'Your code runs slower at night', why: 'Time zones don’t slow code down. Distance does.' },
            { text: 'They need a bigger data plan', why: 'Data plans affect how much they can download, not how long each trip takes.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-speed-q2',
          context: 'Your engineer proposes upgrading to a server twice as powerful (+$400/month) to fix a slow page.',
          prompt: 'What should you ask first?',
          level: 3,
          concepts: ['latency', 'cdn-caching'],
          options: [
            { text: '“Can we get one four times as powerful?”', why: 'If the time is spent waiting on distance and downloads, a faster server barely helps.' },
            { text: '“Where does the time actually go — server thinking, round trips, or downloading?”', correct: true, why: 'In the lab, the server’s thinking was the smallest slice. Measure first; the cheap fixes (compression, fewer requests, CDN) often win.' },
            { text: '“Can we move the company to Australia?”', why: 'Then your other customers would be far away. CDNs solve this without moving.' },
            { text: 'Approve it — speed is worth any price', why: 'Speed matters, but paying for the wrong fix wastes money and leaves the page slow.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w2-speed-q3',
          context: 'You deployed a fix an hour ago. Some customers still see the old, buggy version.',
          prompt: 'What’s the most likely cause?',
          level: 4,
          concepts: ['cdn-caching'],
          options: [
            { text: 'The deploy silently failed everywhere', why: 'Then nobody would see the fix. Some do — so copies are the suspect.' },
            { text: 'Old files are still cached in the CDN or browsers', correct: true, why: 'Caches keep copies until they expire. Good setups give each release new file names or clear the CDN on deploy.' },
            { text: 'Those customers have a different domain', why: 'Same domain, same DNS. The difference is which copy of the files they received.' },
            { text: 'Their accounts are corrupted', why: 'Seeing an old version of the whole app is about files and caches, not accounts.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Test your app from far away, on a mid-range phone, on mobile data. That’s what many customers experience.',
            'Huge images and chatty pages are the usual culprits — and the cheapest to fix.',
            'A CDN is cheap speed, and the reason behind “I deployed but still see the old version.” Ask how caches are cleared on release.',
          ],
        },
      ],
    },
  ],
}

export default world
