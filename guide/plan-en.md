# Poputka AI — Project Plan for the Hackathon (Updated)

**Deadline: September 8 (Presentation is on the same day)**
**Start of Work: Today, September 4**

---

## 1. What We Are Doing

Case 10 from the hackathon PDF: a student ride-sharing system between the city center and the UrFU (Ural Federal University) Novokoltsovsky campus. Student drivers publish their regular routes, and student passengers find travel companions based on route/schedule/rating. The price is lower than a taxi, but covers fuel compensation for the driver.

**Objective:** A functional MVP that demonstrates a real end-to-end trip scenario to the jury in a few minutes, using AI.

---

## 2. Format: Web Application (React), Not a Bot

Initially, we planned a Telegram bot, but the organizers stated that a bot is too simple of a solution. Therefore, we are switching to a **standalone web application**.

The logic and the entire "server" part that we already designed remain almost unchanged — only the interface changes:

| Remains the Same | Changes |
|---|---|
| Synthetic data (30–50 drivers/passengers) | Chat message → Form/Screen |
| Scoring formula (route/schedule/rating/preferences) | Inline button → Regular HTML button |
| LLM integration (Groq/Gemini, free) | Bot library (aiogram) → React |
| Template-based "why it's a match" explanation | — |
| No real backend/DB, no real authentication | Instead of email verification → Simple "enter your name" screen |
| Price formula (distance × coefficient) | — |

---

## 3. Decided Stack

- **React (with Vite)** — Sets up quickly, suitable for beginners
- **Vercel/Netlify** — Free one-click deployment (the link works without depending on a laptop, reducing risks during the demo)
- **Groq API or Google Gemini API** — Free plan
- No real backend/DB — Data is saved in the React state / localStorage

---

## 4. Constraints

- Team: 7 people, all beginner level
- Budget: Zero, only free plans
- No APIs provided by the organizers — We use our own free keys
- Time: Today + ~3.5 days of development, September 8 is presentation day
- Presentation duration is still unknown

---

## 5. What We Are Doing (Mandatory) and What We Are NOT Doing

### Mandatory:
- Three screens: Main screen (role selection + form), results list, booking confirmation
- Synthetic data (30–50 "fake" users)
- Scoring: Route 40%, Schedule 30%, Rating 15%, Preferences 15%
- A single LLM call: Parsing free text into a structured JSON
- Template-based "why it's a match" explanation — without LLM
- Simple price formula, without real traffic data
- Result cards with a clean design + "Book" button

### We are NOT doing:
- Real registration / email verification → Just an "enter your name/username" field
- Real map integration → At most a static Leaflet map (free, no key required) or a textual description of the route
- Demand forecasting and "Smart Crew" → Only mentioned in the presentation as "future plans"
- Separate backend server and real database

---

## 6. Daily Plan

**Day 1 (September 4, Today) — Catching up on lost time:**
- React + Vite setup, GitHub repository, Vercel connection (deploy even an empty "Hello World" to immediately verify that deployment works)
- Skeleton of the three screens
- 3 subgroups: (1) Screens/UI, (2) Mock data + scoring logic, (3) LLM integration + one integrator

**Day 2:**
- Final synthetic data and scoring formula
- Full "main screen → results list" flow with hardcoded data, without AI

**Day 3:**
- LLM integration: Free text form → JSON (test the phrases to be used in the demo in advance)
- Template-based "why it's a match" explanation + price calculation + confirmation screen

**Day 4:**
- UI polishing (cards, colors, icons — the jury evaluates UX/UI separately)
- (Optional) Simple map with Leaflet
- Minimum of 3 full demo rehearsals, verifying that the Vercel link actually works; prepare screenshots as a backup just in case

**Day 5 (September 8 — Presentation Day):**
- Final check and rehearsal in the morning
- Short version of the demo (3–4 minutes) and extended version (5–7 minutes) — both rehearsed

---

## 7. Pitch Structure

1. Problem — Students lose time and money commuting to the campus
2. Solution — The app connects students based on their route
3. AI — The LLM understands the natural language request and explains matches
4. Demo — The most important part
5. Impact — Cheaper, fewer empty seats in cars
6. Future — Demand forecasting, Smart Crew, university integration (verbal mention only)

---

## 8. What Needs to Be Clarified
- Exact duration of the presentation
- Who among the 7 knows Python/JS, to distribute the subgroups
