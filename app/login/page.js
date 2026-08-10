"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const C = {
  bg: "#0B1F17",
  card: "#0F2A20",
  gold: "#E8B34C",
  text: "#F2EFE9",
  textDim: "rgba(242,239,233,0.5)",
  red: "#C1443A",
  green: "#4ADE80",
  line: "rgba(255,255,255,0.1)",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${C.line}`,
    background: C.bg,
    color: C.text,
    fontSize: 14,
    outline: "none",
    marginBottom: 12,
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(traduireErreur(error.message));
      } else {
        setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(traduireErreur(error.message));
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>FTBL PRONOS</h1>
          <p style={{ color: C.textDim, fontSize: 13 }}>
            {mode === "login" ? "Connecte-toi à ton compte" : "Crée ton compte"}
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <input
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe (6 caractères min.)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</p>
          )}
          {info && (
            <p style={{ color: C.green, fontSize: 12, marginBottom: 12 }}>{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              background: C.gold,
              color: C.bg,
              fontWeight: 600,
              fontSize: 14,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textDim }}>
          {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setInfo("");
            }}
            style={{ background: "none", border: "none", color: C.gold, fontSize: 13, fontWeight: 600 }}
          >
            {mode === "login" ? "Inscris-toi" : "Connecte-toi"}
          </button>
        </p>
      </div>
    </div>
  );
}

function traduireErreur(msg) {
  if (msg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (msg.includes("already registered")) return "Cet email a déjà un compte.";
  if (msg.includes("Password should be")) return "Le mot de passe doit faire au moins 6 caractères.";
  return msg;
}
