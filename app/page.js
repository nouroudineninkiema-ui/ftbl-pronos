"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const C = {
  bg: "#0B1F17",
  card: "#0F2A20",
  gold: "#E8B34C",
  text: "#F2EFE9",
  textDim: "rgba(242,239,233,0.4)",
  textDim2: "rgba(242,239,233,0.6)",
  green: "#4ADE80",
  red: "#C1443A",
  line: "rgba(255,255,255,0.1)",
};

const TELEGRAM_CONTACT = "https://t.me/Nouroudine_17";

const statutStyle = {
  "en cours": { color: C.gold, label: "En cours" },
  "gagné": { color: C.green, label: "Gagné" },
  "perdu": { color: C.red, label: "Perdu" },
};

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pronos, setPronos] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subExpiry, setSubExpiry] = useState(null);
  const [tab, setTab] = useState("gratuit");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setSession(session);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    setProfile(profileData);

    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subData) {
      setSubscribed(true);
      setSubExpiry(subData.expires_at);
    }

    await loadPronos();
    setLoading(false);
  }

  async function loadPronos() {
    const { data } = await supabase
      .from("pronos")
      .select("*")
      .order("created_at", { ascending: false });
    setPronos(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.textDim }}>Chargement...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const visiblePronos = pronos.filter((p) => p.niveau === tab);

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>🔥 FTBL PRONOS</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: C.gold,
                  color: C.bg,
                  border: "none",
                }}
              >
                Admin
              </button>
            )}
            <button
              onClick={logout}
              style={{
                fontSize: 10,
                color: C.textDim,
                background: "none",
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                padding: "5px 10px",
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <button
            onClick={() => setTab("gratuit")}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              background: tab === "gratuit" ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === "gratuit" ? C.text : C.textDim2,
            }}
          >
            Gratuit
          </button>
          <button
            onClick={() => setTab("vip")}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              background: tab === "vip" ? C.gold : "transparent",
              color: tab === "vip" ? C.bg : C.textDim2,
            }}
          >
            👑 VIP
          </button>
        </div>

        {tab === "vip" && !subscribed && (
          <a
            href={TELEGRAM_CONTACT}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: C.gold, color: C.bg, borderRadius: 12, padding: "12px 16px",
              marginBottom: 20, fontWeight: 600, fontSize: 14,
            }}
          >
            <span>📩 S'abonner via Telegram</span>
            <span>5 000 F / mois</span>
          </a>
        )}
        {tab === "vip" && subscribed && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)", color: C.green, borderRadius: 12,
            padding: "10px 16px", marginBottom: 20, fontSize: 14,
          }}>
            👑 Abonnement actif — jusqu'au {new Date(subExpiry).toLocaleDateString("fr-FR")}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visiblePronos.length === 0 && (
            <p style={{ textAlign: "center", color: C.textDim, fontSize: 14, padding: "32px 0" }}>
              Aucun prono {tab === "vip" ? "VIP" : "gratuit"} pour le moment.
            </p>
          )}
          {visiblePronos.map((p) => {
            const locked = tab === "vip" && !subscribed;
            const s = statutStyle[p.statut];
            return (
              <div
                key={p.id}
                style={{
                  position: "relative", overflow: "hidden", borderRadius: 12, padding: 20,
                  background: C.card, border: `1px solid ${C.line}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 11, textTransform: "uppercase", color: C.textDim, margin: 0 }}>
                      {p.competition || "—"}
                    </p>
                    <h3 style={{ margin: "2px 0 0", fontWeight: 600 }}>{p.match}</h3>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                    padding: "3px 8px", borderRadius: 999, color: s.color, background: `${s.color}22`,
                  }}>
                    {s.label}
                  </span>
                </div>

                <div style={{ filter: locked ? "blur(4px)" : "none", userSelect: locked ? "none" : "auto", marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px dashed ${C.line}`, paddingTop: 12 }}>
                    <div>
                      <p style={{ fontSize: 12, color: C.textDim, margin: 0 }}>Pronostic</p>
                      <p style={{ margin: "2px 0 0", fontWeight: 500 }}>{p.pick}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 12, color: C.textDim, margin: 0 }}>Cote</p>
                      <p style={{ margin: "2px 0 0", fontWeight: 700, color: C.gold }}>{p.cote}</p>
                    </div>
                  </div>
                </div>

                {locked && (
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 6,
                    background: "rgba(11,31,23,0.85)",
                  }}>
                    <span style={{ fontSize: 20 }}>🔒</span>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0 }}>Réservé aux abonnés</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
