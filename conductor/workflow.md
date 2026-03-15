# Workflow: CityWhisper

## 🔄 Development Lifecycle
CityWhisper follows an iterative **Research -> Strategy -> Execution** lifecycle.

### 1. Research Phase
- **Map the Workspace:** Identify existing code and conventions.
- **Validate Assumptions:** Use empirical evidence (e.g., prototype tests).
- **Plan Mode:** Use `enter_plan_mode` for architectural designs.

### 2. Strategy Phase
- **Formulate Plan:** Create a grounded strategy based on research.
- **Get Approval:** Ensure the user is aligned with the proposed path.

### 3. Execution Phase (Iterative Cycle)
- **Plan:** Define specific implementation and testing strategy.
- **Act:** Apply surgical, idiomatic changes.
- **Validate:** Run tests and standards to confirm success.

## 🤖 Autonomous Verification (Self-Control)
Gemini CLI verifies its own changes before reporting completion:
1. **Backend Tests:** Run `pytest` on all API endpoints.
2. **UI Validation:** Use `chrome-devtools` to verify visual elements and interactions.
3. **Log Monitoring:** Check backend logs for errors after deployment.
4. **No Unverified Commits:** Every feature must be verified through at least one automated test or browser-snapshot.

## 🧪 Testing & Quality
- **Automated Tests:** Mandatory for all new features (using `pytest` for backend).
- **Visual Testing:** Manual verification of UI changes in the browser using `take_screenshot`.

## 📦 Version Control
- **Commits:** Clear, concise messages focusing on "why".
- **Safety:** No staging or committing unless explicitly requested.
- **Environment:** Respect `.gitignore` and security mandates.
