import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate("/");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand-mark">
          <Layers3 size={28} />
          <span>TeamFlow</span>
        </div>
        <h1>Run every project with clarity.</h1>
        <p>
          A focused task workspace for teams to create projects, assign work, and
          track progress without clutter.
        </p>
        <div className="auth-points">
          <span><CheckCircle2 size={18} /> Role-based access</span>
          <span><CheckCircle2 size={18} /> Project dashboards</span>
          <span><CheckCircle2 size={18} /> Assignment tracking</span>
        </div>
      </section>

      <section className="auth-card">
        <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p>{isSignup ? "Start a team workspace in minutes." : "Use your demo or personal account."}</p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} placeholder="Your name" required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="admin@demo.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={updateField} placeholder="password123" required />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
