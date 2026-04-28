import { useEffect, useMemo, useState, type FormEvent } from "react";

type Route =
  | "home"
  | "about"
  | "features"
  | "pricing"
  | "faq"
  | "contact"
  | "login"
  | "dashboard"
  | "billing"
  | "support"
  | "terms"
  | "privacy";

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "card" | "upi" | "wallet";
type PlanId = "starter" | "pro" | "scale";
type SubscriptionStatus = "trial" | "active" | "canceled";
type ToastKind = "success" | "error" | "info";

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  trialDays: number;
  features: string[];
  highlight?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "member" | "admin";
  createdAt: string;
};

type Subscription = {
  id: string;
  planId: PlanId;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  coupon?: string;
  startedAt: string;
  nextRenewal: string;
  paymentMethod: PaymentMethod;
  amount: number;
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  source: "contact" | "chatbot" | "pricing";
  createdAt: string;
  adminEmailQueued: boolean;
  autoReplyQueued: boolean;
};

type Ticket = {
  id: string;
  email: string;
  subject: string;
  message: string;
  priority: "normal" | "urgent";
  status: "open" | "in_review" | "closed";
  source: "support" | "chatbot";
  createdAt: string;
};

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  createdAt: string;
};

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
};

type CheckoutRequest = {
  planId: PlanId;
  cycle: BillingCycle;
};

type EnquiryInput = Omit<Enquiry, "id" | "createdAt" | "adminEmailQueued" | "autoReplyQueued">;
type TicketInput = Omit<Ticket, "id" | "createdAt" | "status">;

const academyName = "Sai Music Academy";
const routes: Route[] = ["home", "about", "features", "pricing", "faq", "contact", "login", "dashboard", "billing", "support", "terms", "privacy"];

const mainNav: { label: string; route: Route }[] = [
  { label: "Home", route: "home" },
  { label: "About", route: "about" },
  { label: "Features", route: "features" },
  { label: "Pricing", route: "pricing" },
  { label: "FAQ", route: "faq" },
  { label: "Contact", route: "contact" },
];

const plans: Plan[] = [
  {
    id: "starter",
    name: "Riyaz Starter",
    tagline: "For new learners starting live online lessons.",
    monthly: 1499,
    yearly: 14990,
    trialDays: 14,
    features: ["1 live class per week", "Practice assignments", "Class reminders", "Basic progress tracking", "Email support"],
  },
  {
    id: "pro",
    name: "Guru Pro",
    tagline: "For serious students who need recordings and faster feedback.",
    monthly: 2999,
    yearly: 29990,
    trialDays: 14,
    highlight: true,
    features: ["2 live classes per week", "Recorded class library", "Teacher feedback notes", "Reschedule controls", "Priority support"],
  },
  {
    id: "scale",
    name: "Academy Scale",
    tagline: "For families, schools, and multi-student learning pods.",
    monthly: 7499,
    yearly: 74990,
    trialDays: 7,
    features: ["Multi-student dashboard", "Dedicated success manager", "Custom lesson plan", "Billing admin tools", "Support SLA"],
  },
];

const featureList = [
  { title: "Live classroom", text: "HD browser lessons with teacher notes, recording controls, and low-friction rescheduling." },
  { title: "Subscription billing", text: "Monthly or yearly plans with trials, coupons, renewal, cancellation, and plan switching flows." },
  { title: "Student dashboard", text: "A single place for class status, profile details, support tickets, enquiries, and billing state." },
  { title: "Support chatbot", text: "Quick replies, FAQ answers, lead capture, ticket creation, and human handoff collection." },
  { title: "Email-ready enquiries", text: "Validated contact submissions store records and queue admin and user auto-reply email events." },
  { title: "Admin-ready data", text: "Users, subscriptions, enquiries, support tickets, and chatbot logs persist locally for API wiring." },
];

const faqList = [
  { q: "Can I start with a trial?", a: "Yes. Each plan supports a trial window during checkout. You can add a coupon before payment confirmation." },
  { q: "Which payment methods are supported?", a: "The checkout supports card, UPI, and wallet flows in this app. It is structured for Stripe, Razorpay, or another secure gateway." },
  { q: "Can I upgrade or downgrade later?", a: "Yes. The billing page lets signed-in users renew, cancel, upgrade, or downgrade with immediate state updates." },
  { q: "Does the contact form send email?", a: "It validates every field, stores the enquiry, and queues admin and auto-reply email records. Connect the API hook to your provider for live delivery." },
  { q: "Can a support agent take over chat?", a: "Yes. The chatbot collects handoff details and creates a support ticket that appears in the support and dashboard areas." },
];

const testimonials = [
  "The dashboard made our lessons feel structured and professional from day one.",
  "Checkout, scheduling, reminders, and support all felt connected and simple.",
  "The chatbot captured our question and converted it into a support ticket instantly.",
];

const couponCodes: Record<string, number> = {
  SAI20: 20,
  TRIAL30: 30,
  YEARLY10: 10,
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function routeHref(route: Route) {
  return route === "home" ? "#/" : `#/${route}`;
}

function getRouteFromHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "") || "home";
  return (routes as string[]).includes(raw) ? (raw as Route) : "home";
}

function formatMoney(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function getPlan(planId: PlanId) {
  return plans.find((plan) => plan.id === planId) ?? plans[0];
}

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function useRoute() {
  const [route, setRouteState] = useState<Route>(getRouteFromHash);

  useEffect(() => {
    const handleHashChange = () => setRouteState(getRouteFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const setRoute = (nextRoute: Route) => {
    window.location.hash = routeHref(nextRoute);
    setRouteState(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return [route, setRoute] as const;
}

function SectionHeading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{kicker}</p>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.kind}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function Header({ route, user }: { route: Route; user: User | null }) {
  return (
    <header className="app-header">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a className="brand-lockup" href={routeHref("home")} aria-label="Sai Music Academy home">
          <img className="brand-logo" src="/images/sai-music-academy-logo.svg" alt="" />
          <span>{academyName}</span>
        </a>
        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
          {mainNav.map((item) => (
            <a key={item.route} className={route === item.route ? "nav-link active" : "nav-link"} href={routeHref(item.route)}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <a className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 sm:inline-flex" href={routeHref("dashboard")}>
              Dashboard
            </a>
          ) : (
            <a className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 sm:inline-flex" href={routeHref("login")}>
              Login
            </a>
          )}
          <a className="primary-button small" href={routeHref("pricing")}>
            Start trial
          </a>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <div className="brand-lockup footer-brand">
            <img className="brand-logo" src="/images/sai-music-academy-logo.svg" alt="" />
            <span>{academyName}</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            A premium SaaS-style learning platform for online music lessons, subscriptions, support, and student operations.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {["features", "pricing", "support", "contact", "dashboard", "billing", "terms", "privacy"].map((item) => (
            <a key={item} className="font-semibold capitalize text-slate-700 transition hover:text-amber-700" href={routeHref(item as Route)}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function HomePage({ openCheckout, navigate }: { openCheckout: (planId: PlanId, cycle: BillingCycle) => void; navigate: (route: Route) => void }) {
  return (
    <>
      <section className="hero-shell">
        <div className="hero-media" aria-hidden="true">
          <img className="hero-image" src="/images/sai-music-academy-hero.jpg" alt="" />
          <div className="hero-shade" />
          <div className="hero-staff hero-staff-one" />
          <div className="hero-staff hero-staff-two" />
        </div>
        <div className="mx-auto flex min-h-[92svh] max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-4xl text-white">
            <img className="hero-logo" src="/images/sai-music-academy-logo.svg" alt="" />
            <p className="mt-5 font-serif text-5xl tracking-tight text-amber-100 sm:text-7xl">{academyName}</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              A premium subscription platform for live online music learning.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-amber-50/90">
              Combine one-to-one lessons, billing, enquiries, chatbot support, and student dashboards in one conversion-ready experience.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button className="primary-button" type="button" onClick={() => openCheckout("pro", "monthly")}>
                Start Guru Pro trial
              </button>
              <button className="secondary-button dark" type="button" onClick={() => navigate("pricing")}>
                Compare plans
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-section" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading kicker="SaaS flows" title="Every core action is wired with state, validation, and confirmation." text="Use the navigation, checkout, billing controls, chatbot, support tickets, enquiry forms, login, and dashboard. Records persist locally and are structured for backend APIs." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featureList.slice(0, 3).map((feature) => (
              <div key={feature.title} className="soft-card">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="stage-section" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading kicker="Popular subscription" title="Launch with a plan that fits the learner journey." text="Monthly and yearly billing, trial support, coupons, and payment method validation are included in the checkout modal." />
          <PlanCards cycle="monthly" openCheckout={openCheckout} compact />
        </div>
      </section>

      <section className="sun-section" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading kicker="Social proof" title="Built to feel trustworthy before a learner pays." />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((quote) => (
              <figure key={quote} className="quote-card">
                <blockquote>"{quote}"</blockquote>
                <figcaption>Sai Music Academy customer</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <PageShell kicker="About" title="A modern academy experience for students, teachers, and operations teams.">
      <div className="prose-block">
        <p>
          Sai Music Academy brings live lessons, guided practice, subscriptions, support, and student communication into one polished web application. The interface is designed for conversion while still supporting practical post-purchase flows.
        </p>
        <p>
          The application keeps users, subscriptions, enquiries, support tickets, and chatbot logs in persistent state so a backend team can connect secure APIs without redesigning the product experience.
        </p>
      </div>
    </PageShell>
  );
}

function FeaturesPage() {
  return (
    <PageShell kicker="Features" title="Production-grade product flows with a premium music academy aesthetic.">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featureList.map((feature) => (
          <div key={feature.title} className="soft-card">
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function PricingPage({ openCheckout }: { openCheckout: (planId: PlanId, cycle: BillingCycle) => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <PageShell kicker="Pricing" title="Choose monthly flexibility or yearly savings.">
      <div className="billing-toggle" role="group" aria-label="Billing cycle">
        <button className={cycle === "monthly" ? "active" : ""} type="button" onClick={() => setCycle("monthly")}>
          Monthly
        </button>
        <button className={cycle === "yearly" ? "active" : ""} type="button" onClick={() => setCycle("yearly")}>
          Yearly
        </button>
      </div>
      <PlanCards cycle={cycle} openCheckout={openCheckout} />
      <div className="comparison-table mt-12 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              {plans.map((plan) => (
                <th key={plan.id}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["Trial", "Coupons", "Card/UPI/Wallet", "Upgrade/Downgrade", "Cancel/Renew", "Support tickets"].map((row) => (
              <tr key={row}>
                <td>{row}</td>
                {plans.map((plan) => (
                  <td key={`${row}-${plan.id}`}>{row === "Trial" ? `${plan.trialDays} days` : "Included"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function PlanCards({ cycle, openCheckout, compact = false }: { cycle: BillingCycle; openCheckout: (planId: PlanId, cycle: BillingCycle) => void; compact?: boolean }) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const price = cycle === "monthly" ? plan.monthly : plan.yearly;
        return (
          <article key={plan.id} className={plan.highlight ? "pricing-card highlighted" : "pricing-card"}>
            <div>
              <p className="plan-tag">{plan.trialDays}-day trial</p>
              <h3>{plan.name}</h3>
              <p className="plan-copy">{plan.tagline}</p>
              <p className="plan-price">
                {formatMoney(price)} <span>/{cycle === "monthly" ? "mo" : "yr"}</span>
              </p>
            </div>
            {!compact ? (
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            ) : null}
            <button className="primary-button full" type="button" onClick={() => openCheckout(plan.id, cycle)}>
              Start {plan.name}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function FAQPage() {
  return (
    <PageShell kicker="FAQ" title="Answers for subscriptions, payment, chatbot, and support.">
      <FAQList />
    </PageShell>
  );
}

function FAQList() {
  return (
    <div className="faq-list">
      {faqList.map((faq) => (
        <details key={faq.q}>
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

function ContactPage({ createEnquiry }: { createEnquiry: (input: EnquiryInput) => Promise<Enquiry> }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = "Enter your name.";
    if (!validateEmail(form.email)) nextErrors.email = "Enter a valid email.";
    if (form.phone.trim().length < 7) nextErrors.phone = "Enter a valid phone number.";
    if (form.subject.trim().length < 3) nextErrors.subject = "Enter a subject.";
    if (form.message.trim().length < 12) nextErrors.message = "Message must be at least 12 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    const enquiry = await createEnquiry({ ...form, source: "contact" });
    setLoading(false);
    setConfirmation(`Enquiry ${enquiry.id} submitted. Admin notification and user auto-reply are queued.`);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <PageShell kicker="Contact" title="Send an enquiry with validation, storage, and email queue states.">
      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label="Phone" error={errors.phone}><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Subject" error={errors.subject}><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field>
        <Field label="Message" error={errors.message} wide><textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field>
        <div className="sm:col-span-2">
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Sending..." : "Send enquiry"}</button>
          {confirmation ? <p className="success-text">{confirmation}</p> : null}
        </div>
      </form>
    </PageShell>
  );
}

function AuthPage({ users, setUsers, setUser, pushToast }: { users: User[]; setUsers: (updater: (users: User[]) => User[]) => void; setUser: (user: User) => void; pushToast: (kind: ToastKind, message: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!validateEmail(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode !== "forgot" && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && form.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setLoading(true);
    await sleep(550);
    if (mode === "forgot") {
      setLoading(false);
      pushToast("success", "Password reset email queued for delivery.");
      return;
    }
    const existing = users.find((user) => user.email.toLowerCase() === form.email.toLowerCase());
    if (mode === "login") {
      if (!existing) {
        setLoading(false);
        setError("No account found. Switch to sign up to create one.");
        return;
      }
      setUser(existing);
      pushToast("success", "Signed in successfully.");
      window.location.hash = routeHref("dashboard");
    } else {
      if (existing) {
        setLoading(false);
        setError("An account already exists. Use login instead.");
        return;
      }
      const user: User = { id: uid("user"), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: "member", createdAt: new Date().toISOString() };
      setUsers((items) => [...items, user]);
      setUser(user);
      pushToast("success", "Account created successfully.");
      window.location.hash = routeHref("dashboard");
    }
    setLoading(false);
  };

  return (
    <PageShell kicker="Account" title="Authentication-ready login, sign up, and reset flows.">
      <div className="auth-panel">
        <div className="billing-toggle compact" role="group" aria-label="Authentication mode">
          {(["login", "signup", "forgot"] as const).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} type="button" onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        <form className="mt-8 grid gap-5" onSubmit={submit}>
          {mode === "signup" ? <Field label="Full name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field> : null}
          <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          {mode === "signup" ? <Field label="Phone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field> : null}
          {mode !== "forgot" ? <Field label="Password"><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full" type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "forgot" ? "Send reset link" : mode === "login" ? "Login" : "Create account"}</button>
        </form>
      </div>
    </PageShell>
  );
}

function DashboardPage({ user, subscription, enquiries, tickets, users, setUser, updateUser, signOut }: { user: User | null; subscription: Subscription | null; enquiries: Enquiry[]; tickets: Ticket[]; users: User[]; setUser: (user: User) => void; updateUser: (user: User) => void; signOut: () => void }) {
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const activePlan = subscription ? getPlan(subscription.planId) : null;
  const userTickets = user ? tickets.filter((ticket) => ticket.email.toLowerCase() === user.email.toLowerCase()) : [];
  const userEnquiries = user ? enquiries.filter((enquiry) => enquiry.email.toLowerCase() === user.email.toLowerCase()) : [];

  useEffect(() => {
    setProfile({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  }, [user]);

  if (!user) return <AuthGate />;

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const updated = { ...user, name: profile.name, email: profile.email, phone: profile.phone };
    setUser(updated);
    updateUser(updated);
  };

  return (
    <PageShell kicker="Dashboard" title={`Welcome back, ${user.name}.`}>
      <div className="dashboard-grid">
        <div className="soft-card strong">
          <h3>Subscription</h3>
          <p>{activePlan ? `${activePlan.name} is ${subscription?.status}. Next date: ${subscription?.nextRenewal.slice(0, 10)}.` : "No active subscription yet."}</p>
          <a className="text-link" href={routeHref("billing")}>Manage billing</a>
        </div>
        <div className="soft-card strong">
          <h3>Support</h3>
          <p>{userTickets.length} ticket records connected to your email.</p>
          <a className="text-link" href={routeHref("support")}>Open support</a>
        </div>
        <div className="soft-card strong">
          <h3>Enquiries</h3>
          <p>{userEnquiries.length} enquiry records with queued notifications.</p>
          <a className="text-link" href={routeHref("contact")}>Send enquiry</a>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="soft-card" onSubmit={saveProfile}>
          <h3>Profile management</h3>
          <div className="mt-5 grid gap-4">
            <Field label="Name"><input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></Field>
            <Field label="Email"><input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></Field>
            <Field label="Phone"><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="primary-button" type="submit">Save profile</button>
            <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
          </div>
        </form>
        <div className="soft-card">
          <h3>Admin-ready operations snapshot</h3>
          <div className="ops-grid mt-5">
            <span>Users<strong>{users.length}</strong></span>
            <span>Enquiries<strong>{enquiries.length}</strong></span>
            <span>Tickets<strong>{tickets.length}</strong></span>
            <span>Auth role<strong>{user.role}</strong></span>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">This data model can be connected to your database, payment webhooks, admin console, and email provider without changing the UI flows.</p>
        </div>
      </div>
    </PageShell>
  );
}

function BillingPage({ user, subscription, setSubscription, openCheckout, pushToast }: { user: User | null; subscription: Subscription | null; setSubscription: (subscription: Subscription | null) => void; openCheckout: (planId: PlanId, cycle: BillingCycle) => void; pushToast: (kind: ToastKind, message: string) => void }) {
  if (!user) return <AuthGate />;
  const activePlan = subscription ? getPlan(subscription.planId) : null;

  const cancel = () => {
    if (!subscription) return;
    setSubscription({ ...subscription, status: "canceled" });
    pushToast("info", "Subscription canceled. Access remains until the current renewal date.");
  };

  const renew = () => {
    if (!subscription) return;
    setSubscription({ ...subscription, status: "active", nextRenewal: addDays(new Date(), subscription.cycle === "monthly" ? 30 : 365) });
    pushToast("success", "Subscription renewed successfully.");
  };

  return (
    <PageShell kicker="Billing" title="Manage subscription, renewal, cancellation, and plan changes.">
      <div className="billing-panel">
        <div>
          <p className="plan-tag">Current plan</p>
          <h3>{activePlan ? activePlan.name : "No plan selected"}</h3>
          <p>{subscription ? `${subscription.status} subscription paid by ${subscription.paymentMethod}. Amount: ${formatMoney(subscription.amount)}.` : "Start a plan from pricing to activate billing."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {subscription ? <button className="primary-button" type="button" onClick={renew}>Renew</button> : null}
          {subscription ? <button className="secondary-button" type="button" onClick={cancel}>Cancel</button> : null}
          <button className="secondary-button" type="button" onClick={() => openCheckout("starter", "monthly")}>Downgrade</button>
          <button className="primary-button" type="button" onClick={() => openCheckout("pro", "yearly")}>Upgrade</button>
        </div>
      </div>
      <PlanCards cycle="monthly" openCheckout={openCheckout} compact />
    </PageShell>
  );
}

function SupportPage({ user, tickets, createTicket }: { user: User | null; tickets: Ticket[]; createTicket: (input: TicketInput) => Promise<Ticket> }) {
  const [form, setForm] = useState({ email: user?.email ?? "", subject: "", message: "", priority: "normal" as "normal" | "urgent" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setForm((current) => ({ ...current, email: user?.email ?? current.email })), [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateEmail(form.email) || form.subject.trim().length < 3 || form.message.trim().length < 10) {
      setError("Enter a valid email, subject, and support message.");
      return;
    }
    setError("");
    setLoading(true);
    await createTicket({ ...form, source: "support" });
    setLoading(false);
    setForm({ email: user?.email ?? "", subject: "", message: "", priority: "normal" });
  };

  return (
    <PageShell kicker="Support" title="Create tickets, request help, and review support history.">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="soft-card" onSubmit={submit}>
          <h3>Create support ticket</h3>
          <div className="mt-5 grid gap-4">
            <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Subject"><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field>
            <Field label="Priority"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as "normal" | "urgent" })}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></Field>
            <Field label="Message"><textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button mt-5" type="submit" disabled={loading}>{loading ? "Creating..." : "Create ticket"}</button>
        </form>
        <div className="soft-card">
          <h3>Recent ticket records</h3>
          <div className="record-list mt-5">
            {tickets.length ? tickets.slice(0, 6).map((ticket) => <p key={ticket.id}><strong>{ticket.subject}</strong><span>{ticket.status} - {ticket.email}</span></p>) : <p>No tickets yet.</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function LegalPage({ type }: { type: "terms" | "privacy" }) {
  return (
    <PageShell kicker={type === "terms" ? "Terms" : "Privacy"} title={type === "terms" ? "Clear product terms for a subscription learning platform." : "Privacy-ready structure for user, billing, support, and enquiry data."}>
      <div className="prose-block">
        <p>This page is structured for legal content, consent language, data retention rules, billing terms, support policies, and user rights.</p>
        <p>Before public launch, connect this page to your approved legal policy, payment processor terms, privacy policy, and regional compliance requirements.</p>
      </div>
    </PageShell>
  );
}

function AuthGate() {
  return (
    <PageShell kicker="Protected" title="Sign in to access this area.">
      <a className="primary-button" href={routeHref("login")}>Go to login</a>
    </PageShell>
  );
}

function PageShell({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading kicker={kicker} title={title} />
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}

function Field({ label, error, wide = false, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "field sm:col-span-2" : "field"}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : null}
    </label>
  );
}

function CheckoutModal({ request, currentUser, onClose, onComplete, pushToast }: { request: CheckoutRequest | null; currentUser: User | null; onClose: () => void; onComplete: (subscription: Subscription, user: User) => void; pushToast: (kind: ToastKind, message: string) => void }) {
  const plan = request ? getPlan(request.planId) : null;
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [coupon, setCoupon] = useState("");
  const [form, setForm] = useState({ name: currentUser?.name ?? "", email: currentUser?.email ?? "", phone: currentUser?.phone ?? "", card: "", expiry: "", cvc: "", upi: "", wallet: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((current) => ({ ...current, name: currentUser?.name ?? current.name, email: currentUser?.email ?? current.email, phone: currentUser?.phone ?? current.phone }));
  }, [currentUser]);

  if (!request || !plan) return null;

  const discount = couponCodes[coupon.trim().toUpperCase()] ?? 0;
  const baseAmount = request.cycle === "monthly" ? plan.monthly : plan.yearly;
  const amount = Math.round(baseAmount * (1 - discount / 100));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2 || !validateEmail(form.email) || form.phone.trim().length < 7) {
      setError("Enter name, valid email, and phone before checkout.");
      return;
    }
    if (coupon.trim() && discount === 0) {
      setError("Coupon not recognized. Try SAI20, TRIAL30, or YEARLY10.");
      return;
    }
    if (method === "card" && (form.card.replace(/\s/g, "").length < 12 || form.expiry.length < 4 || form.cvc.length < 3)) {
      setError("Enter valid card number, expiry, and CVC.");
      return;
    }
    if (method === "upi" && !form.upi.includes("@")) {
      setError("Enter a valid UPI ID, for example name@bank.");
      return;
    }
    if (method === "wallet" && form.wallet.trim().length < 3) {
      setError("Enter a wallet identifier.");
      return;
    }
    setError("");
    setLoading(true);
    await sleep(900);
    const user: User = currentUser ?? { id: uid("user"), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: "member", createdAt: new Date().toISOString() };
    const subscription: Subscription = {
      id: uid("sub"),
      planId: plan.id,
      cycle: request.cycle,
      status: "trial",
      coupon: coupon.trim().toUpperCase() || undefined,
      startedAt: new Date().toISOString(),
      nextRenewal: addDays(new Date(), plan.trialDays),
      paymentMethod: method,
      amount,
    };
    setLoading(false);
    pushToast("success", `${plan.name} checkout complete. Trial is active.`);
    onComplete(subscription, user);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Checkout">
      <form className="checkout-modal" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="plan-tag">Secure checkout</p>
            <h3>{plan.name}</h3>
            <p>{formatMoney(amount)} / {request.cycle}. Trial starts today.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close checkout">x</button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label="Coupon"><input placeholder="SAI20" value={coupon} onChange={(event) => setCoupon(event.target.value)} /></Field>
        </div>
        <div className="payment-methods" role="group" aria-label="Payment method">
          {(["card", "upi", "wallet"] as PaymentMethod[]).map((item) => <button key={item} className={method === item ? "active" : ""} type="button" onClick={() => setMethod(item)}>{item}</button>)}
        </div>
        {method === "card" ? <div className="grid gap-4 sm:grid-cols-3"><Field label="Card number"><input inputMode="numeric" value={form.card} onChange={(event) => setForm({ ...form, card: event.target.value })} /></Field><Field label="Expiry"><input placeholder="MM/YY" value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} /></Field><Field label="CVC"><input inputMode="numeric" value={form.cvc} onChange={(event) => setForm({ ...form, cvc: event.target.value })} /></Field></div> : null}
        {method === "upi" ? <Field label="UPI ID"><input placeholder="name@bank" value={form.upi} onChange={(event) => setForm({ ...form, upi: event.target.value })} /></Field> : null}
        {method === "wallet" ? <Field label="Wallet account"><input placeholder="Phone or wallet ID" value={form.wallet} onChange={(event) => setForm({ ...form, wallet: event.target.value })} /></Field> : null}
        {discount ? <p className="success-text">Coupon applied: {discount}% off.</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button full" type="submit" disabled={loading}>{loading ? "Processing..." : `Confirm ${formatMoney(amount)}`}</button>
        <p className="fine-print">Payment flow is API-ready for a secure gateway. This environment validates and persists the transaction state locally.</p>
      </form>
    </div>
  );
}

function Chatbot({ user, createTicket, createEnquiry }: { user: User | null; createTicket: (input: TicketInput) => Promise<Ticket>; createEnquiry: (input: EnquiryInput) => Promise<Enquiry> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useStoredState<ChatMessage[]>("sai-chat-log", [{ id: uid("chat"), sender: "bot", text: "Hi. I can help with pricing, subscriptions, support tickets, or a human handoff.", createdAt: new Date().toISOString() }]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"idle" | "handoff" | "lead">("idle");
  const [handoff, setHandoff] = useState({ email: user?.email ?? "", issue: "" });
  const [lead, setLead] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });

  const addMessage = (sender: "bot" | "user", message: string) => setMessages((items) => [...items, { id: uid("chat"), sender, text: message, createdAt: new Date().toISOString() }]);

  const respond = (intent: string) => {
    if (intent === "pricing") addMessage("bot", "Riyaz Starter begins at INR 1,499/month. Guru Pro is best for most learners. Use SAI20 for a demo discount.");
    if (intent === "faq") addMessage("bot", "Common topics: trials, payment methods, upgrades, cancellations, and live class support. The FAQ page has the full list.");
    if (intent === "handoff") { setMode("handoff"); addMessage("bot", "I can create a ticket for human support. Please share your email and issue below."); }
    if (intent === "lead") { setMode("lead"); addMessage("bot", "Share your details and admissions will follow up with lesson options."); }
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const message = text.trim();
    addMessage("user", message);
    setText("");
    const lower = message.toLowerCase();
    if (lower.includes("price") || lower.includes("plan")) respond("pricing");
    else if (lower.includes("human") || lower.includes("support")) respond("handoff");
    else addMessage("bot", "I can help with pricing, FAQ, lead capture, or support tickets. Choose a quick action below.");
  };

  const submitHandoff = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateEmail(handoff.email) || handoff.issue.trim().length < 8) return;
    const ticket = await createTicket({ email: handoff.email, subject: "Chatbot handoff", message: handoff.issue, priority: "normal", source: "chatbot" });
    addMessage("bot", `Ticket ${ticket.id} created. A human can follow up from the support queue.`);
    setMode("idle");
    setHandoff({ email: user?.email ?? "", issue: "" });
  };

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    if (lead.name.trim().length < 2 || !validateEmail(lead.email) || lead.phone.trim().length < 7) return;
    const enquiry = await createEnquiry({ name: lead.name, email: lead.email, phone: lead.phone, subject: "Chatbot admissions lead", message: "Lead requested a follow-up from the chatbot.", source: "chatbot" });
    addMessage("bot", `Lead captured as enquiry ${enquiry.id}. Auto-reply and admin email are queued.`);
    setMode("idle");
  };

  return (
    <div className="chatbot">
      {open ? (
        <div className="chat-window">
          <div className="chat-header"><strong>Sai assistant</strong><button type="button" onClick={() => setOpen(false)}>x</button></div>
          <div className="chat-messages">
            {messages.slice(-10).map((message) => <p key={message.id} className={message.sender}>{message.text}</p>)}
          </div>
          <div className="quick-replies">
            <button type="button" onClick={() => respond("pricing")}>Pricing</button>
            <button type="button" onClick={() => respond("faq")}>FAQ</button>
            <button type="button" onClick={() => respond("lead")}>Book demo</button>
            <button type="button" onClick={() => respond("handoff")}>Human handoff</button>
          </div>
          {mode === "handoff" ? <form className="chat-form" onSubmit={submitHandoff}><input placeholder="Email" value={handoff.email} onChange={(event) => setHandoff({ ...handoff, email: event.target.value })} /><textarea placeholder="Issue" value={handoff.issue} onChange={(event) => setHandoff({ ...handoff, issue: event.target.value })} /><button type="submit">Create ticket</button></form> : null}
          {mode === "lead" ? <form className="chat-form" onSubmit={submitLead}><input placeholder="Name" value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} /><input placeholder="Email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} /><input placeholder="Phone" value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} /><button type="submit">Capture lead</button></form> : null}
          <form className="chat-input" onSubmit={send}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask a question" /><button type="submit">Send</button></form>
        </div>
      ) : null}
      <button className="chat-fab" type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Chat"}</button>
    </div>
  );
}

export default function App() {
  const [route, navigate] = useRoute();
  const [users, setUsers] = useStoredState<User[]>("sai-users", []);
  const [user, setUser] = useStoredState<User | null>("sai-current-user", null);
  const [subscription, setSubscription] = useStoredState<Subscription | null>("sai-subscription", null);
  const [enquiries, setEnquiries] = useStoredState<Enquiry[]>("sai-enquiries", []);
  const [tickets, setTickets] = useStoredState<Ticket[]>("sai-tickets", []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [checkout, setCheckout] = useState<CheckoutRequest | null>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.16 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [route]);

  const pushToast = (kind: ToastKind, message: string) => {
    const toast = { id: uid("toast"), kind, message };
    setToasts((items) => [...items, toast]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== toast.id)), 3600);
  };

  const createEnquiry = async (input: EnquiryInput) => {
    await sleep(450);
    const enquiry: Enquiry = { id: uid("enq"), ...input, createdAt: new Date().toISOString(), adminEmailQueued: true, autoReplyQueued: true };
    setEnquiries((items) => [enquiry, ...items]);
    pushToast("success", "Enquiry stored and email notifications queued.");
    return enquiry;
  };

  const createTicket = async (input: TicketInput) => {
    await sleep(450);
    const ticket: Ticket = { id: uid("ticket"), ...input, status: "open", createdAt: new Date().toISOString() };
    setTickets((items) => [ticket, ...items]);
    pushToast("success", "Support ticket created.");
    return ticket;
  };

  const openCheckout = (planId: PlanId, cycle: BillingCycle) => setCheckout({ planId, cycle });

  const completeCheckout = (nextSubscription: Subscription, nextUser: User) => {
    setSubscription(nextSubscription);
    setUser(nextUser);
    setUsers((items) => (items.some((item) => item.email.toLowerCase() === nextUser.email.toLowerCase()) ? items.map((item) => (item.email.toLowerCase() === nextUser.email.toLowerCase() ? nextUser : item)) : [...items, nextUser]));
    setCheckout(null);
    navigate("billing");
  };

  const updateUser = (nextUser: User) => {
    setUsers((items) => items.map((item) => (item.id === nextUser.id ? nextUser : item)));
    pushToast("success", "Profile saved.");
  };

  const page = useMemo(() => {
    if (route === "home") return <HomePage openCheckout={openCheckout} navigate={navigate} />;
    if (route === "about") return <AboutPage />;
    if (route === "features") return <FeaturesPage />;
    if (route === "pricing") return <PricingPage openCheckout={openCheckout} />;
    if (route === "faq") return <FAQPage />;
    if (route === "contact") return <ContactPage createEnquiry={createEnquiry} />;
    if (route === "login") return <AuthPage users={users} setUsers={setUsers} setUser={setUser} pushToast={pushToast} />;
    if (route === "dashboard") return <DashboardPage user={user} subscription={subscription} enquiries={enquiries} tickets={tickets} users={users} setUser={setUser} updateUser={updateUser} signOut={() => { setUser(null); pushToast("info", "Signed out."); }} />;
    if (route === "billing") return <BillingPage user={user} subscription={subscription} setSubscription={setSubscription} openCheckout={openCheckout} pushToast={pushToast} />;
    if (route === "support") return <SupportPage user={user} tickets={tickets} createTicket={createTicket} />;
    if (route === "terms") return <LegalPage type="terms" />;
    return <LegalPage type="privacy" />;
  }, [route, user, subscription, enquiries, tickets, users]);

  return (
    <div className="min-h-screen bg-[#fff8e9] text-slate-950">
      <Header route={route} user={user} />
      {page}
      <Footer />
      <CheckoutModal request={checkout} currentUser={user} onClose={() => setCheckout(null)} onComplete={completeCheckout} pushToast={pushToast} />
      <Chatbot user={user} createTicket={createTicket} createEnquiry={createEnquiry} />
      <ToastList toasts={toasts} />
    </div>
  );
}