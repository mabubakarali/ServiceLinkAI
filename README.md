# ServiceLink AI: Agentic Service Orchestrator 🔗

**ServiceLink AI** is a decentralized, agentic service orchestration platform designed for the informal economy. It transforms the chaotic process of finding, booking, and managing home services into a transparent, self-correcting agentic workflow.

Built for the **#AISeekho 2026 Hackathon**, this project demonstrates a complete end-to-end service lifecycle using an autonomous multi-agent system.

## 🚀 Key Agentic Features

### 1. Multi-Agent Orchestration (Antigravity Architecture)
Instead of a linear script, ServiceLink uses an **Event-Driven Multi-Agent System**:
- **IntentAgent:** Classifies job complexity and urgency using LLM + Heuristic Fallback.
- **PlannerAgent:** Dynamically generates an execution DAG (Directed Acyclic Graph) based on intent.
- **MatchingAgent:** Employs **6-Factor Weighted Matching** (Proximity, Rating, Skill, Reliability, Cancellation Rate, and Review Recency).
- **SupervisorAgent:** Acts as a gatekeeper, approving matches and handling overrides.
- **DisputeAgent:** Automatically triggers on low feedback, proposing refunds or escalating to human review.

### 2. Scheduling Intelligence
Our system doesn't just find a provider; it understands time. If a selected provider has a calendar conflict (double-booking), the **BookingAgent** detects it, triggers a self-correction event, and re-ranks providers to find one with a clear slot + travel buffer.

### 3. Dynamic Pricing Transparency
Agents calculate real-time pricing adjustments based on:
- **Market Variance:** Random +/- 5% fluctuations.
- **Urgency Surge:** +25% for emergency jobs.
- **Loyalty Discounts:** Automated price-capping to meet user budget constraints.

### 4. Baseline Comparison (WOW Factor)
The UI includes a toggle to compare **Standard Linear Search** vs. **Antigravity Agentic Mode**. This demonstrates the clear superiority of agentic reasoning in handling conflicts and failures.

## 🛠️ Technology Stack
- **Core:** React.js (Vite) + Vanilla CSS
- **Agents:** Custom JavaScript Multi-Agent Orchestrator
- **Mobile:** CapacitorJS (Android Native Ready)
- **AI Engine:** Google Gemini API (via VITE_GEMINI_API_KEY)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd AI_Hacakathon
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file and add:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

4. **Run the App:**
   ```bash
   npm run dev
   ```

5. **Mobile Build:**
   ```bash
   npx cap sync
   npx cap open android
   ```

## 🎥 Demo Scenarios
- **Scenario A (Normal):** "AC Repair" - Shows standard successful flow.
- **Scenario B (Complexity):** "Inverter AC installation" - Triggers high-complexity weighting (Skill > Distance).
- **Scenario C (Conflict):** "AC repair at 9 AM" - Triggers scheduling intelligence and automatic re-ranking.
- **Scenario D (Dispute):** Rate 1-star after service completion to see the **DisputeAgent** in action.

## ⚖️ Assumptions & Privacy
- **GPS:** Mocked using `baseDistance` in `mockProviderDB.json`.
- **Privacy:** User data is processed locally in the orchestrator; only anonymized intent is sent to the Gemini API.

---
**Developed by [Your Team Name] for #AISeekho 2026**
