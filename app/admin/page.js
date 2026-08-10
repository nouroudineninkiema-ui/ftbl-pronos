"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const C = {
  bg: "#0B1F17",
  card: "#0F2A20",
  gold: "#E8B34C",
  text: "#F2EFE9",
  textDim: "rgba(242,239,233,0.5)",
  green: "#4ADE80",
  red: "#C1443A",
  line: "rgba(255,255,255,0.1)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: C.bg,
  color: C.text,
  fontSize: 14,
  outline: "none",
};

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [pronos, setPronos] = useState([]);
  const [tabView, setTabView] = useState("pronos");

  const [match, setMatch] = useState("");
  const [pick, setPick] = useState("");
  const [cote, setCote] = useState("");
  const [niveau, setNiveau] = useState("vip");
  const [msg, setMsg] = useState("");

  const [subEmail, setSubEmail] = useState("");
  const [subDays, setSubDays] = useState(30);
  const [subMsg, setSubMsg] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }
    setChecking(false);
    loadPronos();
  }

  async function loadPronos() {
    const { data } = await supabase.from("pronos").select("*").order("created_at", { ascending: false });
    setPronos(data || []);
  }

  async function publierProno(e) {
    e.preventDefault();
    if (!match.trim() || !pick.trim() || !cote.trim()) {
      setMsg("Remplis match, pronostic et cote.");
      return;
    }
    const { error } = await supabase.from("pronos").insert({ match, pick, cote, niveau, statut: "en cours" });
    if (error) {
      setMsg("Erreur : " + error.message);
    } else {
      setMsg("✓ Prono publié.");
      setMatch(""); setPick(""); setCote("");
      loadPronos();
    }
  }

  async function changerStatut(id, statut) {
    await supabase.from("pronos").update({ statut }).eq("id", id);
    loadPronos();
  }

  async function supprimerProno(id) {
    await supabase.from("pronos").delete().eq("id", id);
    loadPronos();
  }

  async function activerAbonne(e) {
    e.preventDefault();
    setSubMsg("");
    if (!subEmail.includes("@")) {
      setSubMsg("Entre un email valide.");
      return;
    }
    const { data: userProfile, error: findErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", subEmail.trim())
      .maybeSingle();

    if (findErr || !userProfile) {
      setSubMsg("Cet email n'a pas encore de compte sur l'app. Le client doit d'abord s'inscrire.");
      return;
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + Number(subDays));

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userProfile.id,
      expires_at: expires.toISOString(),
    });

    if (error) {
      setSubMsg("Erreur : " + error.message);
    } else {
      setSubMsg("✓ Accès VIP activé jusqu'au " + expires.toLocaleDateString("fr-FR"));
      setSubEmail("");
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.textDim }}>Vérification...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>⚙️ Administration</span>
          <button
            onClick={() => router.push("/")}
            style={{ fontSize: 12, color: C.gold, background: "none", border: "none" }}
          >
            ← Retour à l'app
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setTabView("pronos")}
            style={{
              flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, fontWeight: 600,
              background: tabView === "pronos" ? C.gold : "transparent",
              color: tabView === "pronos" ? C.bg : C.text,
            }}
          >
            Pronos
          </button>
          <button
            onClick={() => setTabView("abonnes")}
            style={{
              flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, fontWeight: 600,
              background: tabView === "abonnes" ? C.gold : "transparent",
              color: tabView === "abonnes" ? C.bg : C.text,
            }}
          >
            Abonnés
          </button>
        </div>

        {tabView === "pronos" && (
          <>
            <form onSubmit={publierProno} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 14 }}>Publier un prono</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button type="button" onClick={() => setNiveau("gratuit")}
                  style={{ flex: 1, padding: 8, borderRadius: 8, fontSize: 13, border: `1px solid ${C.line}`,
                    background: niveau === "gratuit" ? "rgba(255,255,255,0.15)" : "transparent", color: C.text }}>
                  Gratuit
                </button>
                <button type="button" onClick={() => setNiveau("vip")}
                  style={{ flex: 1, padding: 8, borderRadius: 8, fontSize: 13, border: `1px solid ${C.line}`,
                    background: niveau === "vip" ? C.gold : "transparent", color: niveau === "vip" ? C.bg : C.text }}>
                  VIP
                </button>
              </div>
              <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Match (ex: PSG — OM)" value={match} onChange={(e) => setMatch(e.target.value)} />
              <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Pronostic" value={pick} onChange={(e) => setPick(e.target.value)} />
              <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Cote (ex: 1.85)" value={cote} onChange={(e) => setCote(e.target.value)} />
              {msg && <p style={{ fontSize: 12, color: msg.startsWith("✓") ? C.green : C.red, marginBottom: 10 }}>{msg}</p>}
              <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: C.gold, color: C.bg, fontWeight: 600 }}>
                Publier
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pronos.map((p) => (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 14 }}>{p.match}</strong>
                    <button onClick={() => supprimerProno(p.id)} style={{ background: "none", border: "none", color: C.red, fontSize: 12 }}>
                      Supprimer
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: C.textDim, margin: "4px 0" }}>{p.pick} · cote {p.cote} · {p.niveau}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {["en cours", "gagné", "perdu"].map((s) => (
                      <button key={s} onClick={() => changerStatut(p.id, s)}
                        style={{
                          fontSize: 11, padding: "4px 8px", borderRadius: 999, border: `1px solid ${C.line}`,
                          background: p.statut === s ? C.gold : "transparent", color: p.statut === s ? C.bg : C.textDim,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tabView === "abonnes" && (
          <form onSubmit={activerAbonne} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, fontSize: 14 }}>Activer un accès VIP</h3>
            <p style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>
              Le client doit d'abord avoir créé son compte sur l'app (inscription avec son email). Une fois le paiement reçu, entre son email ici.
            </p>
            <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="email@client.com" value={subEmail} onChange={(e) => setSubEmail(e.target.value)} />
            <select style={{ ...inputStyle, marginBottom: 10 }} value={subDays} onChange={(e) => setSubDays(e.target.value)}>
              <option value={30}>30 jours</option>
              <option value={7}>7 jours</option>
              <option value={90}>90 jours</option>
            </select>
            {subMsg && <p style={{ fontSize: 12, color: subMsg.startsWith("✓") ? C.green : C.red, marginBottom: 10 }}>{subMsg}</p>}
            <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: C.gold, color: C.bg, fontWeight: 600 }}>
              Activer l'accès VIP
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
