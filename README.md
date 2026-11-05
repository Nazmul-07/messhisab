# MessHisab — Smart Mess & Expense Management SaaS

**MessHisab** is a production-grade frontend web application designed for shared living environments (student messes, bachelor flats, shared apartments, hostels, and small collectives) built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Zustand**.

Engineered specifically for Bangladesh with **BDT (৳)** currency, **Asia/Dhaka (GMT+6)** timezone, and strict **integer-paisa** financial arithmetic to guarantee zero floating-point drift.

---

## 🚀 Feature Modules

### 1. 📊 Executive Dashboard (`/dashboard`)
- **Real-Time KPIs**: Total Bazar Cost, Other Expenses, Total Deposits, Total Meals served, Dynamic Meal Rate, and Active Members count.
- **Visual Trends (Recharts)**:
  - Weekly grocery vs. utility expense distribution.
  - 3-day meal consumption cadence.
- **Combined Ledger Stream**: Latest 10 transactions across all modules with color-coded inflow/outflow pills.
- **Member Financial Overview**: Real-time member balances (Due, Owed, Settled) with one-click drilldowns.
- **Month Selector**: Instant historical month switching (October & November 2026 pre-populated).

### 2. 👥 Members Management (`/members` & `/members/[id]`)
- **Directory**: Responsive Grid and Table view toggles.
- **Member Detail Drawer**: Slideover drawer with 3 tabs (Overview & Balances, Deposits History, Bazar Purchases).
- **Dedicated Profile Route (`/members/[id]`)**: Full-page view with direct URL access, monthly financial charges, and audit history.
- **CRUD Operations**: Add and Edit members with name, email, phone, role (Admin/Member), status (Active/Inactive/Suspended), and customizable avatar color palette.
- **Status Toggles**: One-click activate/deactivate with automated settlement exclusion for inactive members.

### 3. 🛒 Bazar Management (`/bazar`)
- **Grocery Purchases Ledger**: Items purchased, date, amount in BDT, paid-by member, and payment source.
- **Payment Source Tracking**: Differentiates **Personal** member out-of-pocket spending (credited to member) vs. **Cashbox** mess fund spending (no credit created).
- **Receipt Preview**: Built-in modal for viewing grocery receipt attachments.
- **Full CRUD & Filters**: Search by item name or payer, filter by payment source, date range (`From` / `To`), and month selector.

### 4. 🍽️ Meals Management (`/meals`)
- **3-View System**:
  - **Daily Matrix**: Paginated calendar window showing daily member meal tallies.
  - **Monthly Calendar**: Month-at-a-glance showing daily total meals served.
  - **Member Stats**: Detailed breakfast, lunch, and dinner unit counts.
- **Unit Support**: Full meal (`1.0`), Half meal (`0.5`), and No meal (`0.0`).
- **Admin-Only Daily Editor**:
  - Interactive pill cycling (`0 → 1 → 0.5 → 0`).
  - Bulk quick-set tools (*All Full*, *Clear All*, per-row fill).
  - Previous / Next day stepping and Delete Day action.
- **Duplicate Prevention**: Composite key lookup (`memberId:date`) guarantees zero duplicate logs.

### 5. 💳 Deposits Management (`/deposits`)
- **Deposit Ledger**: Tracks contributions via **bKash**, **Nagad**, **Rocket**, **Bank Transfer**, and **Cash**.
- **Member Contribution Status Cards**: Visual status cards showing total deposits per member (clickable to filter ledger).
- **Search & Filters**: Search by notes or member name, filter by payment method and date range.
- **Add / Edit Deposit**: Form with Zod validation and integer-paisa conversion.

### 6. 🧾 Shared Expenses (`/expenses`)
- **Category Coverage**: House Rent, DESCO Electricity, Titas Gas, WiFi / Internet, WASA Water, Cook & Cleaner Salary, Kitchen Utensils, and Miscellaneous.
- **3 Allocation Methods**:
  - **Equal Split**: Even division across all active mess members.
  - **Meal-Based Allocation**: Proportional division based on member meal units consumed.
  - **Custom Allocation**: Member-wise custom share editor with live balance validation (ensures individual allocations sum exactly to the expense amount).
- **Payment Sources**: Cashbox mess fund disbursements vs. Personal member advances.

### 7. 🔁 Unified Transactions Ledger (`/transactions`)
- **Single Source of Financial Truth**: Combines Bazar purchases, Member deposits, and Shared expenses into a unified chronological ledger.
- **Zero Double-Counting**: Outflows and Inflows are tracked with unique reference IDs and consistent signs.
- **KPI Metrics**: Total records, Total Inflow (Deposits), Total Outflow (Bazar + Bills), and Net Balance.
- **Filters & Pagination**: Multi-category filter pills, date range (`From` / `To`), participant selector, column sorting, and dynamic pagination (20 records/page).

### 8. 📑 Monthly Reports (`/reports`)
- **Audited Executive Statement**: Meal Rate, Total Bazar, Shared Bills, Total Deposits, and Active Members.
- **Expense Distribution Charts**: Donut chart of category allocations and bar chart of member cost vs. total paid.
- **Zero-Sum Balance Sheet**: Mathematical verification of total expenditure, deposits, and cashbox variance.
- **Print / PDF Export**: Dedicated `@media print` layout hiding navigation and controls, formatted with official header and signature lines (*Mess Admin*, *Member Auditor*, *Treasurer*).

### 9. ⚖️ Settlements & Account Closing (`/settlements`)
- **Dual-State Workflow**:
  - **Preview Mode (Live Draft)**: Default state for ongoing billing periods. Clearly alerts users that figures update dynamically as new records are added. The preview is never treated as a closed ledger.
  - **Finalized & Closed**: Locks the month's accounting ledger with an immutable audit record (closed timestamp, admin name, total dues, total refunds, and notes).
  - **Re-Open Capability**: Admins can re-open a finalized month if adjustments are necessary.
- **Mathematical Equilibrium**:
  $$\sum \text{Member Net Balances} + \text{Remaining Cashbox Balance} = 0$$
- **Rounding Variance Check**: Audits individual member rounded charges against total mess expenditures.
- **Actionable Collection**: Per-member *Mark Settled* toggle button to track dues received or refunds disbursed.

### 10. ⚙️ Settings (`/settings`)
- **Mess Workspace**: Name, address, currency (`BDT`), and timezone (`Asia/Dhaka`).
- **Admin Profile**: Name, email, and phone number configuration.
- **Theme Switcher**: Instant Dark Mode, Light Mode, and System Sync.

---

## 🧮 Financial Calculation Architecture

All monetary values are stored and calculated as **integer paisa** to completely eliminate binary floating-point drift:
- `৳1.00 = 100 paisa`
- `৳14,000.00 = 1,400,000 paisa`

### Core Formulas
```
Meal Rate (paisa) = Total Bazar Cost (paisa) ÷ Total Meals
Member Meal Cost = round(Member Total Meals × Meal Rate)
Member Total Cost = Member Meal Cost + Allocated Shared Expenses
Member Total Credit = Deposits + Personal Out-of-Pocket Advances
Member Net Balance = Member Total Cost − Member Total Credit
```

- **Positive Net Balance (+)**: Member owes money (Payable to mess / Due).
- **Negative Net Balance (−)**: Member has overpaid (Receivable / Refund from mess).
- **Zero (0)**: Fully settled.

---

## 🛠️ Technology Stack

| Layer | Tool / Library |
|---|---|
| **Framework** | Next.js 16.4.5 (App Router, Webpack build) |
| **Runtime** | React 19 |
| **Language** | TypeScript 5 (Strict mode) |
| **Styling** | Tailwind CSS v4, Base-Nova design tokens |
| **UI Primitives** | Base UI (`@base-ui/react`), Radix / shadcn conventions |
| **Icons** | Lucide React |
| **Data Visualization** | Recharts (SVG literal colors, SSR mount guard) |
| **Form Handling** | React Hook Form + Zod (`@hookform/resolvers`) |
| **State Management** | Zustand v5 with LocalStorage persistence |
| **Date Utilities** | date-fns v4 |
| **Notifications** | Sonner toast alerts |

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The root URL automatically redirects to `/dashboard`.

### 3. Verify TypeScript Types
```bash
npx tsc --noEmit
```

### 4. Run ESLint
```bash
npm run lint
```

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🛡️ Audit & Quality Assurance

- **Type Safety**: 100% TypeScript strict compliance (0 compiler errors).
- **Linting**: 0 ESLint errors.
- **Production Build**: All 15 routes pre-rendered / statically compiled cleanly.
- **Responsive Design**: Verified across mobile (drawer navigation), tablet, and desktop (collapsible sidebar).
- **Theme Support**: Seamless Dark Mode and Light Mode with high-contrast text and chart elements.
- **No Backend Dependency**: 100% self-contained frontend with Zustand persistent mock state.
