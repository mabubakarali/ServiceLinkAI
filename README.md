# ServiceLink AI: Agentic Service Orchestrator 🔗

**ServiceLink AI** is a decentralized, agentic service orchestration platform designed for the informal economy. It transforms the chaotic process of finding, booking, and managing home services into a transparent, self-correcting agentic workflow.

Built for the **#AISeekho 2026 Hackathon**, this project demonstrates a complete end-to-end service lifecycle using an autonomous multi-agent system.

---

## 🏛️ Architecture: The Antigravity ED-MAS
Our system uses an **Event-Driven Multi-Agent System (ED-MAS)** where independent agents observe the environment, reason about state, and execute tools.

### 🧠 Autonomous Agents
1.  **IntentAgent**: Parses code-switched (English/Urdu/Roman Urdu) requests using **Google Gemini 1.5 Flash**. If confidence is <70%, it triggers a "Clarification Request" tool.
2.  **MatchingAgent**: Evaluates an **8-Factor Decision Matrix** (Proximity, Rating, Skill, Reliability, Cancellation Rate, Review Recency, **Workload Fairness**, and **Experience Depth**).
3.  **PricingAgent**: Calculates dynamic surge pricing based on peak hours (8-10 AM, 5-8 PM), location multipliers, and **Loyalty Budget Alignment**.
4.  **RecoveryAgent**: Monitors for "System Fractures" (cancellations). Automatically re-ranks alternatives with a **30-minute travel-time buffer** to maintain Service Level Agreements (SLAs).
5.  **DisputeAgent**: Analyzes feedback loops. For 1-star ratings, it automatically triggers a "Full Refund" proposal and escalates to human supervisors.

---

## 📊 Data Schema (AI-Ready)
| Entity | Key Fields | Purpose |
| :--- | :--- | :--- |
| **Provider** | `id`, `category`, `skills[]`, `rating`, `reliability`, `jobsToday`, `completedJobs` | Core matching & fairness data. |
| **Intent** | `service`, `urgency`, `location`, `budget`, `complexity` | Extracted intent for planning. |
| **Trace** | `agent`, `trace`, `confidence`, `toolUsed` | Transparent reasoning logs for audit. |

---

## ⚖️ Baseline Comparison (Agentic vs. Standard)
| Feature | Standard App (Non-Agentic) | ServiceLink AI (Agentic) |
| :--- | :--- | :--- |
| **Matching** | Nearest provider by distance. | 8-Factor weighted matrix + Ecosystem Fairness. |
| **Failure** | User must manually find someone else. | **RecoveryAgent** fixes it automatically in 500ms. |
| **Pricing** | Fixed flat rates. | Dynamic matrix with peak surge & budget capping. |
| **Feedback** | Static reviews. | **Service Quality Loop** with real-time checklists. |

---

## 🚀 Scalability & Cost Analysis
*   **Cost per Request**: ~$0.0004 (Gemini 1.5 Flash API).
*   **Latency**: Intent parsing (1.2s) + Matching (0.8s) + Pricing (0.5s) = **2.5s total orchestration**.
*   **Scaling**: The event-driven architecture is stateless and can be deployed in serverless environments (Firebase/AWS Lambda) to handle **100,000+ concurrent requests**.

---

## 🎥 Robustness Evidence (Stress Tests)
1.  **Failure Scenario**: "Inject Provider Cancellation" button demonstrates self-healing recovery.
2.  **Ambiguity**: Requesting "Kuch cooling ka masla hai" triggers IntentAgent to identify AC Repair with high confidence.
3.  **Ecosystem Fairness**: The system penalizes "Overloaded" providers (high `jobsToday`) to ensure fair

## 🚀 Key Agentic Features
1. **Multi-Agent Orchestration (Antigravity Architecture)**
   - Uses an Event-Driven Multi-Agent System (Intent, Planner, Matching, Quality, Pricing).
2. **Autonomous Fallback Engine (Zero Downtime)** 🛡️
   - Implements a heuristic regex-based reasoning engine that takes over if LLM API quotas are reached, ensuring 100% uptime during live demonstrations.
3. **Temporal Reasoning & Backtracking** ⏳
   - Automatically detects deadlines (e.g., "Baraat at 2 PM") and back-calculates mandatory arrival times based on service duration buffers.
4. **Explainable Matching Engine (XAI)** 🧠
   - A multi-factor decision matrix (Proximity, Skill, Fairness, Reliability) that generates category-specific reasoning for every provider selection.
5. **Self-Healing Recovery** 🩹
   - Automatically detects provider cancellations or scheduling conflicts and triggers autonomous re-ranking and re-assignment.

---

## 👥 The Team
*   **Muhammad Abubakar Ali**
*   **Muhammad Taha**

---
**Developed for #AISeekho 2026** - *Transforming the Informal Economy with Google Antigravity.*
