import type { World } from '../../lib/types'
import { ArchMap } from '../../components/ArchMap'
import { MrrBuilder, RevenueCompare } from '../../widgets/RevenueCompare'
import { SaasModel } from '../../widgets/SaasModel'
import { PricingLab, ValueCalc } from '../../widgets/PricingLab'
import { FunnelSim, RetentionCurves } from '../../widgets/FunnelSim'

const world: World = {
  id: 'w11',
  num: 11,
  title: 'Software Business',
  tagline: 'The numbers that decide if a software company survives.',
  emoji: '📈',
  color: '#5c940d',
  skill: 'business',
  concepts: [
    { id: 'mrr', name: 'MRR & ARR' },
    { id: 'arpu', name: 'ARPU & customer mix' },
    { id: 'churn', name: 'Churn' },
    { id: 'gross-margin', name: 'Gross margin' },
    { id: 'cac', name: 'Customer acquisition cost (CAC)' },
    { id: 'ltv', name: 'Lifetime value (LTV)' },
    { id: 'value-pricing', name: 'Value-based pricing' },
    { id: 'conversion', name: 'Conversion funnels' },
    { id: 'retention', name: 'Retention & cohorts' },
  ],
  lessons: [
    /* ------------------------------------------------------------ */
    {
      id: 'w11-revenue',
      title: 'MRR, ARR & ARPU',
      subtitle: 'Why 1,000 × $10 and 10 × $1,000 are different companies.',
      minutes: 6,
      concepts: ['mrr', 'arpu'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔁',
          title: 'Revenue that comes back every month',
          what: 'MRR (monthly recurring revenue) is the subscription money you can expect next month if nothing changes. ARR is the same thing per year: MRR × 12.',
          why: 'One-off sales start from zero every month. Recurring revenue stacks up — which is why software companies, investors and buyers track MRR above almost everything else.',
        },
        {
          kind: 'widget',
          title: 'Build your MRR',
          instruction: 'Add customers and payments. Watch which ones move MRR — and which only move cash.',
          render: ({ done }) => <MrrBuilder onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The four numbers',
          points: [
            { term: '🔁 MRR', text: 'Recurring revenue per month. Annual plans count as their yearly price ÷ 12.' },
            { term: '📆 ARR', text: 'MRR × 12. Same information, bigger number — popular with B2B companies and investors.' },
            { term: '👤 ARPU', text: 'Average revenue per user (or account): MRR ÷ paying customers. Tells you what a typical customer is worth.' },
            { term: '💵 Cash ≠ MRR', text: 'Upfront annual payments and setup fees bring in cash, but MRR only counts what repeats each month.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Same MRR, two different companies',
          instruction: 'Both make $10,000 a month. Run all four stress tests.',
          render: ({ done }) => <RevenueCompare onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w11-revenue-q1',
          context: 'This month: one customer prepaid $2,400 for a year. One pays $50 a month. One paid a one-time $1,000 setup fee (and pays nothing monthly).',
          prompt: 'What is your MRR?',
          level: 2,
          concepts: ['mrr'],
          options: [
            { text: '$3,450', why: 'That’s the cash you collected. MRR ignores one-off fees and spreads annual plans across 12 months.' },
            { text: '$250', correct: true, why: '$2,400 ÷ 12 = $200, plus $50 a month = $250. The $1,000 setup fee won’t repeat, so it isn’t recurring.' },
            { text: '$1,250', why: 'Close on the annual plan… but the $1,000 setup fee is one-time money, not monthly recurring revenue.' },
            { text: '$2,450', why: 'The $2,400 covers a whole year, so only $200 of it belongs to each month.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-revenue-q2',
          context: 'You have $10,000 MRR from 10 customers. Your largest ($1,000/mo) says: build a feature only we need, or we leave.',
          prompt: 'What’s the smartest response?',
          level: 3,
          concepts: ['arpu', 'mrr'],
          options: [
            { text: 'Build it immediately — they’re 10% of revenue.', why: 'Saying yes on reflex teaches every big customer to steer your roadmap, and custom code is something you maintain forever.' },
            {
              text: 'Weigh it: does it fit the roadmap, will they pay for it? Either way, start reducing how much any one customer is worth to you.',
              correct: true,
              why: 'Concentration risk is real at this size. Treat the request as a business deal, and make winning more customers a priority so one email can’t sink you.',
            },
            { text: 'Refuse — customers shouldn’t dictate the product.', why: 'Listening to big customers is how many B2B products find their best features. The problem is blindly obeying, not listening.' },
            { text: 'Raise everyone’s price to make up for the risk.', why: 'That punishes the other nine customers for a problem with one, and risks losing them too.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-revenue-q3',
          context: 'Your co-founder: “ARPU jumped 20% this month!”',
          prompt: 'What should you check before celebrating?',
          level: 4,
          concepts: ['arpu', 'mrr'],
          options: [
            {
              text: 'Whether MRR grew too — or whether lots of cheap customers simply left.',
              correct: true,
              why: 'ARPU is an average. If your $10 customers churn, ARPU rises while total revenue falls. Always read ARPU next to MRR and customer count.',
            },
            { text: 'Nothing — higher ARPU is always good.', why: 'Averages can mislead. A shrinking business can show rising ARPU.' },
            { text: 'Whether ARR also went up 20%.', why: 'ARR is just MRR × 12; it moves with total revenue, not with the average per customer. It can’t tell you why ARPU moved.' },
            { text: 'Whether server costs went up.', why: 'Costs matter for margin, but ARPU is purely about revenue per customer.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Know your MRR, customer count and ARPU every month — investors and buyers will ask in the first five minutes.',
            'Your price decides your company: low ARPU needs self-serve signup and lots of customers; high ARPU needs sales and great support.',
            'If one customer is more than ~10% of revenue, treat it as a risk to manage, not just a win.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w11-unit-economics',
      title: 'CAC, LTV, churn & gross margin',
      subtitle: 'Run a live model of a subscription business.',
      minutes: 10,
      concepts: ['churn', 'gross-margin', 'cac', 'ltv'],
      steps: [
        {
          kind: 'concept',
          emoji: '🌱',
          title: 'Every customer is a small investment',
          what: 'You spend money to win a customer (CAC). They pay you monthly, minus what it costs to serve them (gross margin), until they cancel (churn). What you earn over that whole time is their lifetime value (LTV).',
          why: 'These four numbers tell you whether growing faster makes you richer — or just burns cash faster.',
        },
        {
          kind: 'points',
          title: 'The vocabulary',
          points: [
            { term: '📣 CAC', text: 'Customer acquisition cost: ads, sales time and tools ÷ new paying customers.' },
            { term: '📉 Churn', text: 'The share of customers who cancel each month. 5% monthly churn means you lose about half your customers in a year.' },
            { term: '🧮 Gross margin', text: '(Price − cost to serve) ÷ price. Hosting, AI fees, payment fees and support come out first.' },
            { term: '💎 LTV', text: 'ARPU × gross margin ÷ monthly churn. Roughly: profit per month × how many months they stay.' },
            { term: '⏳ CAC payback', text: 'CAC ÷ (ARPU × gross margin): months until a customer has paid back what it cost to win them.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Run the business',
          instruction: 'Move at least three sliders. Try to complete the mission.',
          render: ({ done }) => <SaasModel onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w11-unit-economics-q1',
          context: 'ARPU $50/month · gross margin 80% · monthly churn 5%.',
          prompt: 'What is the LTV?',
          level: 2,
          concepts: ['ltv', 'gross-margin', 'churn'],
          options: [
            { text: '$800', correct: true, why: '$50 × 80% = $40 profit a month. At 5% churn, the average customer stays 1 ÷ 0.05 = 20 months. $40 × 20 = $800.' },
            { text: '$1,000', why: 'That’s $50 ÷ 5% — it forgets gross margin. Revenue you spend on serving the customer isn’t value you keep.' },
            { text: '$40', why: 'That’s the profit from one month. LTV multiplies it by how long the customer stays.' },
            { text: '$2', why: 'That multiplies by churn instead of dividing. Lower churn should mean a higher LTV, not a lower one.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-unit-economics-q2',
          context: 'Price $29, cost to serve $6, churn 8%, CAC $400. LTV:CAC is about 0.7× — you lose money on every customer.',
          prompt: 'You can fund ONE project this quarter. Which helps most?',
          level: 3,
          concepts: ['churn', 'ltv', 'cac'],
          options: [
            {
              text: 'Halve churn from 8% to 4% (better onboarding, fix top complaints).',
              correct: true,
              why: 'LTV = $23 ÷ churn, so halving churn doubles LTV (~$287 → ~$575) and LTV:CAC goes to ~1.4×. Retention compounds; it’s usually the biggest lever.',
            },
            { text: 'Cut CAC by 20% with cheaper ads.', why: 'CAC drops to $320, but LTV:CAC only reaches ~0.9× — still losing money per customer.' },
            { text: 'Double the ad budget to get more customers.', why: 'With LTV below CAC, each extra customer loses money. More of them just loses money faster.' },
            { text: 'Cut the cost to serve from $6 to $4.', why: 'Margin improves slightly (79% → 86%), but LTV:CAC only reaches ~0.8×. Nice, but not the big lever here.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-unit-economics-q3',
          context: 'You add an AI assistant. AI fees cost $12 per customer per month. You charge $15.',
          prompt: 'What’s the real problem?',
          level: 3,
          concepts: ['gross-margin'],
          options: [
            { text: 'Nothing — you’re still making $3 per customer.', why: 'A 20% gross margin leaves almost nothing to pay for acquisition, support and the team. Software companies usually aim for 70–80%+.' },
            {
              text: 'Gross margin is 20%: each new customer barely adds profit. Reprice, limit usage, or cut AI costs.',
              correct: true,
              why: '($15 − $12) ÷ $15 = 20%. Usage-based costs like AI can quietly destroy margins, so price features that cost you per use accordingly.',
            },
            { text: 'Churn will be too high.', why: 'Nothing here says customers will leave. The problem is what each one costs to serve.' },
            { text: 'CAC will go up.', why: 'Acquisition cost isn’t affected by your AI bill. The issue is the cost of serving customers you already have.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-unit-economics-q4',
          context: 'An enterprise product: gross margin 85%, LTV:CAC 5×, but CAC payback is 30 months.',
          prompt: 'An engineer-turned-investor says, “Great LTV:CAC, but I’m worried.” Why?',
          level: 4,
          concepts: ['cac', 'ltv', 'churn'],
          options: [
            {
              text: 'You must fund 2.5 years of costs before each customer pays back — faster growth means bigger cash needs, and the LTV depends on very low churn holding.',
              correct: true,
              why: 'LTV:CAC says a customer is profitable eventually; payback says when. Long paybacks make growth cash-hungry, and if churn rises the LTV evaporates before you’re repaid.',
            },
            { text: 'An 85% gross margin is too low for software.', why: '85% is excellent. The issue is timing, not margin.' },
            { text: 'LTV:CAC of 5× is too high — you should spend less on marketing.', why: 'A high ratio can mean under-investing in growth, but that’s not the worry here. The 30-month payback is.' },
            { text: 'Payback doesn’t matter if LTV:CAC is good.', why: 'It matters a lot: payback decides how much cash you need to grow, and cash is what runs out.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Rough healthy targets: LTV:CAC of 3× or more, CAC payback under 12 months, software gross margin of 70%+.',
            'Churn is the silent killer: it caps how big you can get, no matter how much you spend on marketing.',
            'Usage-based costs (AI, SMS, video) belong in your price — check gross margin before launching them.',
            'If LTV is below CAC, don’t scale marketing. Fix retention or pricing first.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w11-pricing',
      title: 'The pricing lab',
      subtitle: 'Five prices, five different businesses.',
      minutes: 8,
      concepts: ['value-pricing', 'arpu'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏷️',
          title: 'Price is about value, not effort',
          what: 'Value-based pricing means charging a fair share of what your product is worth to the customer — the time saved, money earned or risk avoided.',
          why: 'Customers don’t know or care what your product cost to build. They compare your price with the value they get and with their alternatives.',
        },
        {
          kind: 'widget',
          title: 'Try five prices',
          instruction: 'Tap at least four prices and compare customers, support load and profit.',
          render: ({ done }) => <PricingLab onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'What is it worth to a clinic?',
          instruction: 'Move all three sliders: hours saved, staff cost, and your price.',
          render: ({ done }) => <ValueCalc onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w11-pricing-q1',
          context: 'It took 3 months to build ClinicBook, and servers cost about $3 per clinic. A friend suggests $9/month: “cost plus a healthy markup.”',
          prompt: 'What’s wrong with that reasoning?',
          level: 3,
          concepts: ['value-pricing'],
          options: [
            { text: 'Nothing — cost-plus is how pricing works.', why: 'Cost-plus works for commodities. Software costs almost nothing per extra customer, so cost tells you the floor, not the right price.' },
            {
              text: 'It ignores value. If ClinicBook saves a clinic ~$800 a month in staff time, $99 is still an easy yes.',
              correct: true,
              why: 'Price from the customer’s gain. Cost only sets the minimum; value sets what they’ll happily pay.',
            },
            { text: '$9 is too high for a new product.', why: 'Low prices bring more support load, more churn and less profit per customer — as the lab showed.' },
            { text: 'It should include the 3 months of build time.', why: 'Build time is spent either way. Customers won’t pay more because something was hard to make.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-pricing-q2',
          prompt: 'In the lab, $9 brought 35× more customers than $499 — but less profit. Why?',
          level: 2,
          concepts: ['arpu', 'value-pricing'],
          options: [
            { text: 'Cheap customers pay late.', why: 'Payment timing wasn’t the issue. It was cost per customer versus revenue per customer.' },
            {
              text: 'Every customer brings support tickets and infrastructure cost. At $9, those eat most of the revenue.',
              correct: true,
              why: '1,400 customers create 700 tickets and $4,200 of infrastructure. Low ARPU leaves very little room for the cost of serving each customer.',
            },
            { text: 'Expensive customers don’t need support.', why: 'They need more support each (named contact, onboarding) — but there are far fewer of them, so the total is lower.' },
            { text: 'Because of payment processing fees.', why: 'The lab didn’t even include payment fees. Support and infrastructure per customer did the damage.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-pricing-q3',
          context: 'You’re moving from $29 to $99 for new customers. 300 existing customers pay $29.',
          prompt: 'What’s the most sensible way to handle existing customers?',
          level: 4,
          concepts: ['value-pricing', 'arpu'],
          options: [
            { text: 'Switch everyone to $99 tomorrow.', why: 'A 3× surprise increase triggers a churn wave and angry reviews — and you lose the chance to learn whether new customers accept $99.' },
            {
              text: 'Launch $99 for new customers first; keep existing customers at $29 for a while, then give plenty of notice and added value before any change.',
              correct: true,
              why: 'This tests the new price on people with no anchor, protects trust, and gives you data before touching current revenue.',
            },
            { text: 'Keep $29 forever for everyone, to be safe.', why: 'Never raising prices leaves money on the table as your product gets better. Raise them — carefully.' },
            { text: 'Quietly add hidden fees instead.', why: 'Hidden fees destroy trust faster than an honest price increase, and they cause support tickets and chargebacks.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Most early founders underprice. If nobody ever pushes back on price, it’s probably too low.',
            'Your price picks your customers: cheap attracts tire-kickers who churn; higher prices attract serious buyers who expect more.',
            'Write down the value math (hours saved × hourly cost) and put it on your pricing page and in sales calls.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w11-funnel',
      title: 'Conversion & retention',
      subtitle: 'Where people drop off — and whether they stay.',
      minutes: 7,
      concepts: ['conversion', 'retention'],
      unlocks: ['analytics'],
      steps: [
        {
          kind: 'concept',
          emoji: '🫗',
          title: 'A funnel, then a bucket',
          what: 'A funnel shows how many people make it through each step: visit → sign up → get value (“activate”) → pay. Retention shows how many keep paying month after month.',
          why: 'Small improvements at each step multiply. And if customers don’t stay, every marketing dollar leaks away.',
        },
        {
          kind: 'widget',
          title: 'Tune the funnel',
          instruction: 'Move all three conversion sliders and watch new revenue change.',
          render: ({ done }) => <FunnelSim onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Words you’ll hear',
          points: [
            { term: '🔄 Conversion rate', text: 'The % of people who move from one step to the next.' },
            { term: '⚡ Activation', text: 'The moment a new user first gets real value — e.g. books their first appointment. The best predictor of who will pay.' },
            { term: '👥 Cohort', text: 'Everyone who started in the same month, tracked together over time.' },
            { term: '📈 Net revenue retention', text: 'Revenue from a cohort a year later ÷ what it started at, including upgrades. Above 100% means existing customers grow on their own.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Read a retention curve',
          instruction: 'Tap all three curve shapes.',
          render: ({ done }) => <RetentionCurves onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Analytics on the map',
          instruction: 'Tap Analytics and the boxes around it.',
          render: ({ done }) => <ArchMap revealAll only={['frontend', 'backend', 'analytics', 'database']} onExplored={(n) => n >= 2 && done()} />,
        },
        {
          kind: 'quiz',
          id: 'w11-funnel-q1',
          context: '10,000 visitors · 5% sign up · 40% of signups activate · 25% of activated users pay.',
          prompt: 'How many new paying customers?',
          level: 2,
          concepts: ['conversion'],
          options: [
            { text: '50', correct: true, why: '10,000 × 5% = 500 signups → × 40% = 200 activated → × 25% = 50 paying. Each rate multiplies the one before.' },
            { text: '200', why: 'That’s how many activated. Only 25% of those go on to pay.' },
            { text: '125', why: 'That skips the activation step: 500 × 25% = 125. Only activated users get the chance to pay here.' },
            { text: '2,500', why: 'That’s 25% of all visitors. Each step only applies to the people who survived the step before.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-funnel-q2',
          context: 'Your retention curve is a leaky bucket: after 6 months, 18% of each cohort’s revenue remains and it keeps falling. Marketing wants to double ad spend.',
          prompt: 'What do you do?',
          level: 3,
          concepts: ['retention', 'conversion'],
          options: [
            { text: 'Double the ads — growth fixes everything.', why: 'With a leaky bucket, new customers drain away just like the old ones. You’d pay twice as much to stay roughly where you are.' },
            {
              text: 'Hold the ad budget. Talk to customers who left, fix activation and the top reasons they quit, until the curve flattens.',
              correct: true,
              why: 'A flattening curve is the sign that the product keeps people. Once it’s flat, every marketing dollar builds a lasting base.',
            },
            { text: 'Cut the price in half to keep people.', why: 'If people leave because they don’t get value, a cheaper price rarely fixes it — and it halves your revenue.' },
            { text: 'Stop measuring retention; it’s depressing.', why: 'The numbers are what tell you which fix works. Not measuring doesn’t stop the leak.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w11-funnel-q3',
          context: 'A 50%-off promo boosted signups by 50%. Overall retention looks “about the same” on the dashboard.',
          prompt: 'What should you look at before repeating the promo?',
          level: 4,
          concepts: ['retention', 'conversion'],
          options: [
            {
              text: 'The promo cohort’s retention on its own, compared with normal cohorts.',
              correct: true,
              why: 'Blended averages hide differences. If the promo cohort churns twice as fast, the signups were mostly discount-hunters — and the promo lost money.',
            },
            { text: 'Total signups — they went up, so it worked.', why: 'Signups are the top of the funnel. What matters is how many became lasting paying customers.' },
            { text: 'Website traffic.', why: 'Traffic is even further from revenue than signups. The question is whether these customers stay.' },
            { text: 'Nothing — retention is “about the same.”', why: '“About the same” across all customers can hide a terrible promo cohort mixed in with good ones.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Pick 5 numbers you check every week: visitors, signups, activation rate, paid conversion, and cohort retention.',
            'Define “activated” in one sentence (“booked a first appointment”) — it focuses product, onboarding and marketing.',
            'Fix the bucket before you fill it: retention first, then spend on acquisition.',
            'Analytics collects data about real people. Track what you need, and say so in your privacy policy.',
          ],
        },
      ],
    },
  ],
}

export default world
