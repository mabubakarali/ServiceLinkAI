# ServiceLink AI: Agentic Service Orchestrator 🔗

**ServiceLink AI** is a decentralized, agentic service orchestration platform designed for the informal economy. It transforms the chaotic process of finding, booking, and managing home services into a transparent, self-correcting agentic workflow.

Built for the **#AISeekho 2026 Hackathon**, this project demonstrates a complete end-to-end service lifecycle using an autonomous multi-agent system that prioritizes reliability over simple search.

---

## 🚀 The Antigravity Agentic Architecture
Unlike traditional linear booking systems, ServiceLink AI utilizes an **Event-Driven Multi-Agent System (ED-MAS)**. Each agent operates autonomously, subscribing to specific lifecycle events and emitting reasoning traces.

### 🧠 Core Agents
1.  **IntentAgent (The Linguist)**: Uses **Google Gemini** to parse complex requests in **English, Urdu, and Roman Urdu**. It features a regex-based **Heuristic Fallback Engine** to ensure 100% uptime even if LLM latency is high.
2.  **PlannerAgent (The Architect)**: Generates a dynamic execution plan. It classifies jobs as *Basic, Intermediate, or Complex*, which fundamentally alters how providers are ranked.
3.  **MatchingAgent (The Evaluator)**: Employs a **6-Factor Weighted Matrix**:
    *   *Distance, Rating, Skill Match, Reliability Score, Cancellation Rate, and Review Recency.*
    *   **Agentic Logic**: If a job is "Complex," the agent automatically shifts 50% of the weight to *Skill Match*, deprioritizing distance.
4.  **PricingAgent (The Economist)**: Calculates truly dynamic pricing based on:
    *   **Peak Hours**: 15% surge during 8-10 AM and 5-8 PM.
    *   **Location Multipliers**: Travel adjustments for specific sectors (e.g., Bahria Phase 7).
    *   **Budget Alignment**: Automatically applies "Loyalty Discounts" if the calculated price is slightly above the user's provided budget.
5.  **RecoveryAgent (The Self-Healer)**: **[CRITICAL FEATURE]** If a provider cancels, this agent intercepts the event, triggers an immediate "High Urgency" re-ranking, and secures a replacement without user intervention.
6.  **DisputeAgent (The Mediator)**: Automatically triggers on ratings < 3 stars. It proposes instant resolutions (e.g., "Full Refund + 20% Discount") and escalates critical 1-star issues to human supervisors.

---

## 🛠️ Technology Stack
*   **Frontend**: React.js (Vite) + Vanilla CSS (Premium Dark Theme)
*   **Orchestrator**: Custom JavaScript Event-Driven Engine
*   **Mobile**: CapacitorJS (Android Native Bridge)
*   **LLM**: Google Gemini 1.5 Flash (via Generative AI SDK)
*   **State Management**: Centralized Orchestrator with EventBus Subscriptions

---

## 💎 Explainable AI (XAI) Features
We believe in "Show, Don't Just Tell." The UI includes:
*   **Antigravity Reasoning Trace**: A real-time terminal showing every thought process, confidence score, and tool used by the agents.
*   **Match Decision Cards**: Transparency into why a specific provider was selected and why others were rejected (e.g., "Disqualified: 09:00 AM Scheduling Conflict detected").

---

## 📦 Installation & Setup

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/mabubakarali/ServiceLinkAI.git
    cd AI_Hacakathon
    npm install
    ```
2.  **Environment Setup**: Create a `.env` file:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```
3.  **Run Development**:
    ```bash
    npm run dev
    ```

---

## 🎥 Demo Scenarios to Try
*   **Scenario A (The Inverter Challenge)**: Enter "Inverter AC installation." Watch the `MatchingAgent` prioritize specialized skills over proximity.
*   **Scenario B (The Conflict)**: Request a service at "9 AM." The system detects a mock provider conflict and automatically re-routes.
*   **Scenario C (The Recovery)**: Use the **"Inject Provider Cancellation"** button mid-flow to see the `RecoveryAgent` rescue the session in real-time.

---

## 👥 The Team
**Developed for #AISeekho 2026 by:**
*   **Muhammad Abubakar Ali**
*   **Muhammad Taha**

---
*ServiceLink AI is a conceptual project built to demonstrate the power of Agentic Workflows in the South Asian Gig Economy.*
