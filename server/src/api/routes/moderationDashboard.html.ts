/** HTML template for the moderation dashboard SPA. Served inline by Hono so auth is enforced server-side. */
export const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moderation Dashboard – survev.de</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:       #080810; --surface: #0f0f1e; --surface2: #14142a; --surface3: #1a1a34;
      --border:   #1e1e3a; --border2: #2a2a4a;
      --text:     #c8c8e0; --text-dim: #5a5a7a; --text-muted: #3a3a55;
      --blue:     #3355ee; --blue-dim: #0e1e55; --blue-t: #5577ff;
      --green:    #1a7a1a; --green-t: #44cc44; --green-dim: #0a2a0a;
      --orange:   #aa4400; --orange-t: #ff8833; --orange-dim: #2a1000;
      --red:      #aa1a1a; --red-t: #ff4444;   --red-dim: #1e0808;
      --yellow-t: #ffcc44;
    }
    html, body { height: 100vh; overflow: hidden; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; font-size: 13px; display: flex; flex-direction: column; }

    /* ── Top bar ── */
    #topbar {
      display: flex; align-items: center; gap: 16px; padding: 12px 24px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, #0c0c20 0%, var(--bg) 100%);
      flex-shrink: 0;
    }
    #topbar-title { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: .5px; }
    #topbar-user  { margin-left: auto; color: var(--text-dim); font-size: 12px; }
    #live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green-t); display: inline-block; margin-right: 4px; box-shadow: 0 0 5px var(--green-t); }
    #live-dot.off { background: var(--text-muted); box-shadow: none; }

    /* ── Tabs ── */
    #tabs { display: flex; gap: 2px; padding: 0 24px; background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .tab-btn {
      padding: 10px 20px; cursor: pointer; border: none; background: none;
      color: var(--text-dim); font-size: 13px; font-weight: 500; font-family: inherit;
      border-bottom: 2px solid transparent; transition: color .15s, border-color .15s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--blue-t); border-bottom-color: var(--blue-t); }

    /* ── Main area ── */
    #main { flex: 1; min-height: 0; position: relative; }
    .tab-pane { display: none; position: absolute; inset: 0; overflow-y: auto; padding: 20px 24px; }
    .tab-pane.active { display: block; }
    .tab-pane > * + * { margin-top: 14px; }

    /* ── Toolbar row ── */
    .toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .toolbar input[type=text] {
      background: var(--surface2); border: 1px solid var(--border2); border-radius: 6px;
      color: var(--text); padding: 6px 10px; font-size: 12px; font-family: inherit;
      outline: none; flex: 1; min-width: 160px;
    }
    .toolbar input[type=text]:focus { border-color: var(--blue); }

    /* ── Sub-tabs (inside Tab 1) ── */
    .sub-tabs { display: flex; gap: 6px; }
    .sub-tab-btn {
      padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border2);
      background: none; color: var(--text-dim); cursor: pointer; font-size: 12px; font-family: inherit;
    }
    .sub-tab-btn.active { background: var(--blue-dim); border-color: var(--blue); color: var(--blue-t); }

    /* ── Table ── */
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: var(--surface2); color: var(--text-dim); font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border2); }
    .data-table td { padding: 7px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--surface2); }
    .data-table .ip-link { cursor: pointer; color: var(--blue-t); text-decoration: underline; font-family: monospace; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; letter-spacing: .3px; }
    .badge-admin  { background: var(--orange-dim); color: var(--orange-t); border: 1px solid var(--orange); }
    .badge-self   { background: var(--green-dim);  color: var(--green-t);  border: 1px solid var(--green); }
    .badge-alive  { background: var(--green-dim);  color: var(--green-t);  }
    .badge-dead   { background: var(--red-dim);    color: var(--red-t);    }
    .badge-spec   { background: var(--surface3);   color: var(--text-dim); }
    .badge-perm   { background: var(--red-dim);    color: var(--red-t);    border: 1px solid var(--red); }
    .badge-temp   { background: var(--orange-dim); color: var(--orange-t); }
    .badge-disc   { background: var(--surface3);   color: var(--text-muted); border: 1px solid var(--border2); }

    /* ── Buttons ── */
    .btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 5px; border: none; cursor: pointer; font-size: 11px; font-family: inherit; font-weight: 600; transition: opacity .15s; }
    .btn:hover { opacity: .85; }
    .btn-red    { background: var(--red-dim);    color: var(--red-t);    border: 1px solid var(--red); }
    .btn-blue   { background: var(--blue-dim);   color: var(--blue-t);   border: 1px solid var(--blue); }
    .btn-green  { background: var(--green-dim);  color: var(--green-t);  border: 1px solid var(--green); }
    .btn-orange { background: var(--orange-dim); color: var(--orange-t); border: 1px solid var(--orange); }
    .btn-gray   { background: var(--surface3);   color: var(--text-dim); border: 1px solid var(--border2); }
    .btn-primary { background: var(--blue); color: #fff; }
    .btn-sm { padding: 3px 8px; font-size: 10px; }

    /* ── Cards (game list) ── */
    #server-list { display: flex; flex-direction: column; gap: 16px; }
    .region-block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .region-header { background: var(--surface2); padding: 10px 14px; font-weight: 600; color: var(--text-dim); font-size: 12px; border-bottom: 1px solid var(--border); }
    .game-cards { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px; }
    .game-card {
      background: var(--surface2); border: 1px solid var(--border2); border-radius: 6px;
      padding: 10px 14px; cursor: pointer; min-width: 160px; transition: border-color .15s;
    }
    .game-card:hover { border-color: var(--blue); }
    .game-card.pinned { border-color: var(--yellow-t); }
    .game-card.selected { border-color: var(--blue-t); background: var(--blue-dim); }
    .game-card .gc-id    { font-size: 10px; color: var(--text-muted); font-family: monospace; margin-bottom: 4px; }
    .game-card .gc-mode  { font-size: 12px; font-weight: 600; }
    .game-card .gc-count { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

    /* ── Game detail panel ── */
    #game-detail { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; overflow: hidden; }
    #game-detail-header { background: var(--surface2); padding: 10px 14px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); }
    #game-detail-header .gd-id { font-family: monospace; font-size: 11px; color: var(--text-dim); }
    #game-actions { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 14px; border-bottom: 1px solid var(--border); }
    #player-table-wrap { overflow-x: auto; }

    /* ── IP detail card ── */
    .detail-card { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 16px; }
    .detail-card h3 { font-size: 13px; margin-bottom: 10px; color: var(--text-dim); }
    .kv-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; }
    .kv-key { color: var(--text-dim); min-width: 90px; }
    .kv-val { color: var(--text); font-family: monospace; }

    /* ── Announce inline panel ── */
    #announce-panel {
      display: none; background: var(--surface3); border: 1px solid var(--border2);
      border-radius: 6px; padding: 10px 12px; gap: 8px; align-items: center; flex-wrap: wrap;
    }
    #announce-panel.open { display: flex; }
    #announce-input { flex: 1; min-width: 200px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 5px; padding: 6px 10px; color: var(--text); font-family: inherit; font-size: 12px; outline: none; }
    #announce-input:focus { border-color: var(--blue); }

    /* ── Msg panel ── */
    #msg-panel { display: none; background: var(--surface3); border: 1px solid var(--border2); border-radius: 6px; padding: 10px 12px; gap: 8px; align-items: center; flex-wrap: wrap; }
    #msg-panel.open { display: flex; }
    #msg-target-label { font-size: 12px; color: var(--blue-t); font-weight: 600; }
    #msg-input { flex: 1; min-width: 200px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 5px; padding: 6px 10px; color: var(--text); font-family: inherit; font-size: 12px; outline: none; }
    #msg-input:focus { border-color: var(--blue); }

    /* ── Sortable table headers ── */
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { color: var(--text); }

    /* ── Empty / loading states ── */
    .empty { color: var(--text-muted); font-size: 12px; padding: 24px; text-align: center; }
    .loading { color: var(--text-dim); font-size: 12px; padding: 12px; text-align: center; }

    /* ── Toast ── */
    #toast { position: fixed; bottom: 20px; right: 20px; background: var(--surface3); border: 1px solid var(--border2); border-radius: 6px; padding: 8px 14px; font-size: 12px; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 999; }
    #toast.show { opacity: 1; }
  </style>
</head>
<body>

<!-- ── Top bar ── -->
<div id="topbar">
  <span id="topbar-title">⬛ Moderation Dashboard</span>
  <span id="topbar-live"><span id="live-dot" class="off"></span><span id="live-label" style="font-size:11px;color:var(--text-muted)">Connecting…</span></span>
  <span id="topbar-user" style="margin-left:auto;color:var(--text-dim);font-size:12px;">Loading…</span>
</div>

<!-- ── Tabs ── -->
<div id="tabs">
  <button class="tab-btn active" data-tab="bans">Bans</button>
  <button class="tab-btn"        data-tab="lookup">IP / Player</button>
  <button class="tab-btn"        data-tab="servers">Live Servers</button>
  <button class="tab-btn"        data-tab="accounts">Accounts</button>
</div>

<div id="main">

  <!-- ════════════════ TAB 1: BANS ════════════════ -->
  <div id="tab-bans" class="tab-pane active">
    <div class="toolbar">
      <div class="sub-tabs">
        <button class="sub-tab-btn active" data-sub="ip">IP Bans</button>
        <button class="sub-tab-btn"        data-sub="account">Account Bans</button>
        <button class="sub-tab-btn"        data-sub="chat">Chat Bans</button>
      </div>
      <input type="text" id="ban-search" placeholder="Search by hash, name, reason…">
      <button class="btn btn-primary" id="ban-new-btn">+ New Ban</button>
    </div>

    <!-- IP-Bans table -->
    <div id="sub-ip">
      <table class="data-table">
        <thead><tr>
          <th>IP Hash</th><th>Reason</th><th>Banned By</th><th>Type</th><th>Expires</th><th>Actions</th>
        </tr></thead>
        <tbody id="ip-ban-tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
      </table>
    </div>

    <!-- Account-Bans table -->
    <div id="sub-account" style="display:none">
      <table class="data-table">
        <thead><tr>
          <th>Slug</th><th>Username</th><th>Reason</th><th>Banned By</th><th>Actions</th>
        </tr></thead>
        <tbody id="account-ban-tbody"><tr><td colspan="5" class="loading">Loading…</td></tr></tbody>
      </table>
    </div>

    <!-- Chat-Bans table -->
    <div id="sub-chat" style="display:none">
      <table class="data-table">
        <thead><tr>
          <th>IP Hash</th><th>Reason</th><th>Banned By</th><th>Type</th><th>Expires</th><th>Actions</th>
        </tr></thead>
        <tbody id="chat-ban-tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ════════════════ TAB 2: IP / PLAYER LOOKUP ════════════════ -->
  <div id="tab-lookup" class="tab-pane">
    <div class="toolbar">
      <input type="text" id="lookup-input" placeholder="Enter IP hash or player name…" style="max-width:420px">
      <button class="btn btn-primary" id="lookup-btn">Search</button>
    </div>
    <div id="lookup-result"></div>
    <!-- Recent players quick-access list, hidden when a search is active -->
    <div id="recent-block">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;font-weight:600;letter-spacing:.5px;">RECENT PLAYERS</div>
      <table class="data-table" id="recent-table">
        <thead><tr><th>Name</th><th>Slug</th><th>IP Hash</th><th>ISP</th><th>Region</th><th>Last seen</th></tr></thead>
        <tbody id="recent-tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ════════════════ TAB 4: ACCOUNTS ════════════════ -->
  <div id="tab-accounts" class="tab-pane">
    <div class="toolbar">
      <input type="text" id="accounts-search" placeholder="Search by username or slug…">
      <button class="btn btn-orange" id="reconcile-btn">⚡ Reconcile All Passes + Unlocks</button>
      <span id="reconcile-result" style="font-size:11px;color:var(--text-dim);"></span>
    </div>
    <table class="data-table" id="accounts-table">
      <thead><tr id="accounts-thead-row">
        <th>#</th>
        <th class="sortable" data-col="username">Username</th>
        <th>Slug</th>
        <th style="white-space:nowrap">Created</th>
        <th>Last IP</th>
        <th>Flags</th>
        <!-- pass-level columns injected by renderAccountsHeader() -->
      </tr></thead>
      <tbody id="accounts-tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
    </table>
  </div>

  <!-- ════════════════ TAB 3: LIVE SERVERS ════════════════ -->
  <div id="tab-servers" class="tab-pane">
    <!-- Global announcement (sent to ALL running games) -->
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-blue btn-sm" id="global-announce-open">📢 Announce to ALL games</button>
    </div>
    <div id="global-announce-panel" style="display:none;background:var(--surface3);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;gap:8px;align-items:center;flex-wrap:wrap;">
      <input id="global-announce-input" type="text" placeholder="Message to all players in all games…" maxlength="200"
        style="flex:1;min-width:200px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;padding:6px 10px;color:var(--text);font-family:inherit;font-size:12px;outline:none;">
      <input id="global-announce-color" type="color" value="#ffffff" title="Message color"
        style="width:32px;height:26px;padding:1px;border-radius:4px;border:1px solid var(--border2);background:var(--surface2);cursor:pointer;">
      <button class="btn btn-blue btn-sm" id="global-announce-send">SEND</button>
      <button class="btn btn-gray btn-sm" id="global-announce-cancel">✕</button>
    </div>

    <div id="server-list"><div class="loading">Connecting to stream…</div></div>

    <!-- Game detail panel (shown when a game is clicked) -->
    <div id="game-detail" style="display:none">
      <div id="game-detail-header">
        <span class="gd-id" id="gd-game-id"></span>
        <span class="gd-mode" id="gd-mode"></span>
        <button class="btn btn-gray btn-sm" id="gd-close-btn" style="margin-left:auto">✕ Close</button>
      </div>

      <!-- Game-level action buttons -->
      <div id="game-actions">
        <button class="btn btn-green  btn-sm" id="ga-verify">VERIFY LOBBY</button>
        <button class="btn btn-red    btn-sm" id="ga-unverify">UNVERIFY LOBBY</button>
        <button class="btn btn-orange btn-sm" id="ga-freeze">FREEZE</button>
        <button class="btn btn-gray   btn-sm" id="ga-unfreeze">UNFREEZE</button>
        <button class="btn btn-blue   btn-sm" id="ga-announce-open">ANNOUNCEMENT</button>
        <label style="display:flex;align-items:center;gap:6px;margin-left:auto;font-size:11px;color:var(--text-dim);cursor:pointer;">
          <input type="checkbox" id="show-disconnected" onchange="renderPlayers()">
          Show disconnected
        </label>
      </div>

      <!-- Announcement input panel (all-players) -->
      <div id="announce-panel" style="margin: 0 14px 10px;">
        <input id="announce-input" type="text" placeholder="Message to all players…" maxlength="200">
        <input id="announce-color" type="color" value="#ffffff" title="Message color" style="width:32px;height:26px;padding:1px;border-radius:4px;border:1px solid var(--border2);background:var(--surface2);cursor:pointer;">
        <button class="btn btn-blue btn-sm" id="ga-announce-send">SEND</button>
        <button class="btn btn-gray btn-sm" id="ga-announce-cancel">✕</button>
      </div>

      <!-- Direct-message panel (per-player) -->
      <div id="msg-panel" style="margin: 0 14px 10px;">
        <span>MSG to:</span>
        <span id="msg-target-label"></span>
        <input id="msg-input" type="text" placeholder="Message…" maxlength="200">
        <input id="msg-color" type="color" value="#44aaff" title="Message color" style="width:32px;height:26px;padding:1px;border-radius:4px;border:1px solid var(--border2);background:var(--surface2);cursor:pointer;">
        <button class="btn btn-blue btn-sm" id="msg-send-btn">SEND</button>
        <button class="btn btn-gray btn-sm" id="msg-cancel-btn">✕</button>
      </div>

      <!-- Player list -->
      <div id="player-table-wrap">
        <table class="data-table" id="player-table">
          <thead><tr>
            <th>Name</th><th>IP Hash</th><th>Kills</th><th>Assists</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody id="player-tbody"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
        </table>
      </div>

      <!-- Live chat + kill feed panel -->
      <div id="game-feed-panel" style="margin:10px 14px 0;border:1px solid var(--border2);border-radius:6px;overflow:hidden;">
        <div style="background:var(--surface2);padding:6px 12px;font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:.5px;">LIVE CHAT &amp; KILL FEED</div>
        <div id="game-feed-list" style="max-height:200px;overflow-y:auto;padding:6px 10px;display:flex;flex-direction:column;gap:3px;font-size:12px;"></div>
        <div style="display:flex;gap:6px;padding:6px 10px;border-top:1px solid var(--border);">
          <input id="chat-send-input" type="text" maxlength="150" placeholder="Send message to game chat…"
            style="flex:1;background:var(--surface);border:1px solid var(--border2);border-radius:4px;padding:5px 8px;color:var(--text);font-family:inherit;font-size:12px;outline:none;">
          <button class="btn btn-blue btn-sm" id="chat-send-btn">SEND</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ── Toast notification ── -->
<div id="toast"></div>

<!-- ── New-ban modal ── -->
<div id="ban-modal" style="display:none;position:fixed;inset:0;background:#00000088;z-index:100;align-items:center;justify-content:center;">
  <div style="background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:20px;width:360px;display:flex;flex-direction:column;gap:12px;">
    <div style="font-weight:700;font-size:14px;">Create New Ban</div>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;">
      <div>
        <div style="color:var(--text-dim);margin-bottom:4px;">Type</div>
        <select id="modal-ban-type" onchange="onBanTypeChange()" style="width:100%;background:var(--surface2);color:var(--text);border:1px solid var(--border2);border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;">
          <option value="ip">IP Ban</option>
          <option value="account">Account Ban</option>
          <option value="chat">Chat Ban</option>
        </select>
      </div>
      <div>
        <div style="color:var(--text-dim);margin-bottom:4px;">Target <span id="modal-target-hint" style="color:var(--text-muted)">(IP hash)</span></div>
        <input id="modal-ban-target" type="text" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;padding:6px;color:var(--text);font-family:inherit;font-size:12px;" placeholder="ip-hash or account-slug">
      </div>
      <div>
        <div style="color:var(--text-dim);margin-bottom:4px;">Reason</div>
        <input id="modal-ban-reason" type="text" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;padding:6px;color:var(--text);font-family:inherit;font-size:12px;">
      </div>
      <!-- Duration fields – hidden for Account Bans (no expiry in DB) -->
      <div id="modal-duration-block">
        <div style="color:var(--text-dim);margin-bottom:4px;">Duration (days)</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <input id="modal-ban-days" type="number" value="7" min="1" style="width:80px;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;padding:6px;color:var(--text);font-family:inherit;font-size:12px;">
          <label style="display:flex;align-items:center;gap:6px;color:var(--text-dim);cursor:pointer;">
            <input id="modal-ban-perm" type="checkbox" onchange="document.getElementById('modal-ban-days').disabled=this.checked">
            Permanent
          </label>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px;">
      <button class="btn btn-gray" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-red"  id="modal-confirm-btn">Ban</button>
    </div>
  </div>
</div>

<script>
// ═══════════════════════════════════════════════════════════════════════════
// Moderation Dashboard – client-side logic
//
// Live updates are driven by a single SSE stream (/moderation/api/events).
// The server pushes events whenever data changes:
//   "bans"    → full ban list (on every ban/unban action)
//   "servers" → regions + game list (every 8 s server-side)
//   "players" → player list of the watched game (every 3 s server-side)
//
// The client never polls — it only reacts to push events.
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let currentAdminId   = '';    // own userId (for "YOU" badge + hide self-buttons)
let currentAdminSlug = '';    // own slug (shown as sender in announcements)
let activeGameRegion = '';    // region of the selected game
let activeGameId     = '';    // id of the selected game
let activeGameVerified = false; // verified-only state of the selected game
let msgTargetName    = '';    // player being DM'd
let bansData = { ipBans: [], accountBans: [], chatBans: [] };
let serverData = { regions: [] };
let currentPlayers = [];

// Single SSE connection – reconnected when switching to server tab or selecting a game
let evtSource = null;

// ── Utilities ──────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/moderation' + path, opts);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
const get  = (path)       => api('GET',  path);
const post = (path, body) => api('POST', path, body);

function toast(msg, err) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = err ? 'var(--red)' : 'var(--green)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function ipLink(hash) {
  return '<span class="ip-link" data-hash="' + esc(hash) + '" title="' + esc(hash) + '">' + esc(hash.slice(0,12)) + '…</span>';
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Clicking an IP link navigates to the lookup tab
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('ip-link')) {
    const hash = e.target.dataset.hash;
    switchTab('lookup');
    document.getElementById('lookup-input').value = hash;
    doLookup(hash);
  }
});

// ── SSE connection ─────────────────────────────────────────────────────────

function setLiveStatus(connected) {
  document.getElementById('live-dot').className   = connected ? '' : 'off';
  document.getElementById('live-label').textContent = connected ? 'Live' : 'Disconnected';
  document.getElementById('live-label').style.color = connected ? 'var(--green-t)' : 'var(--text-muted)';
}

/**
 * Opens (or re-opens) the SSE stream.
 * Pass region + gameId to also receive "players" events for that game.
 * Omit them to receive only "bans" and "servers" events.
 */
function connectSSE(region, gameId) {
  if (evtSource) { evtSource.close(); evtSource = null; }

  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (gameId)  params.set('gameId', gameId);

  evtSource = new EventSource('/moderation/api/events?' + params.toString());

  evtSource.addEventListener('bans', (e) => {
    bansData = JSON.parse(e.data);
    renderBans();
  });

  evtSource.addEventListener('servers', (e) => {
    serverData = JSON.parse(e.data);
    renderServers();
  });

  evtSource.addEventListener('players', (e) => {
    currentPlayers = JSON.parse(e.data).players ?? [];
    renderPlayers();
  });

  evtSource.addEventListener('feed', (e) => {
    const { chat = [], kills = [] } = JSON.parse(e.data);
    const list = document.getElementById('game-feed-list');
    if (!list) return;
    const entries = [
      ...chat.map(m => \`<div class="feed-chat" style="color:var(--blue-t)">💬 <b>\${esc(m.username||'?')}</b>: \${esc(m.message||'')}</div>\`),
      ...kills.map(k => \`<div class="feed-kill" style="color:var(--red-t)">💀 <b>\${esc(k.killerName||'?')}</b> killed <b>\${esc(k.victimName||'?')}</b> [\${esc(k.weapon||'')}]</div>\`),
    ];
    for (const html of entries) {
      const div = document.createElement('div');
      div.innerHTML = html;
      list.prepend(div.firstChild);
    }
    // Cap feed display at 100 entries
    while (list.children.length > 100) list.removeChild(list.lastChild);
  });

  evtSource.onopen  = () => setLiveStatus(true);
  evtSource.onerror = () => {
    setLiveStatus(false);
    // Browser auto-reconnects EventSource; we just update the indicator
  };
}

function closeSSE() {
  if (evtSource) { evtSource.close(); evtSource = null; }
  setLiveStatus(false);
}

// ── Tab switching ──────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-pane').forEach(p => {
    const active = p.id === 'tab-' + name;
    p.classList.toggle('active', active);
    p.style.display = active ? 'block' : 'none';
  });

  if (name === 'servers') {
    connectSSE(null, null);
  } else if (name === 'bans') {
    connectSSE(null, null);
  } else if (name === 'lookup') {
    closeSSE();
    // Show the recent-players list when entering the tab
    document.getElementById('lookup-result').innerHTML = '';
    document.getElementById('recent-block').style.display = '';
    document.getElementById('lookup-input').value = '';
    loadRecent();
  } else if (name === 'accounts') {
    closeSSE();
    loadAccounts();
  } else {
    closeSSE();
  }
}

document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

// Initial tab visibility
document.querySelectorAll('.tab-pane').forEach(p => { p.style.display = p.classList.contains('active') ? 'block' : 'none'; });

// ── Sub-tab switching (inside Bans tab) ────────────────────────────────────

function switchSub(name) {
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.sub === name));
  ['ip','account','chat'].forEach(s => {
    const el = document.getElementById('sub-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}
document.querySelectorAll('.sub-tab-btn').forEach(b => b.addEventListener('click', () => switchSub(b.dataset.sub)));

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 – BAN MANAGEMENT (receives live "bans" events via SSE)
// ═══════════════════════════════════════════════════════════════════════════

function renderBans() {
  const q = document.getElementById('ban-search').value.toLowerCase();
  renderIpBans(q);
  renderAccountBans(q);
  renderChatBans(q);
}

function renderIpBans(q) {
  const tbody = document.getElementById('ip-ban-tbody');
  const rows = bansData.ipBans.filter(b =>
    !q || b.encodedIp.includes(q) || (b.reason||'').toLowerCase().includes(q) || (b.bannedBy||'').toLowerCase().includes(q)
  );
  tbody.innerHTML = rows.length ? rows.map(b => \`
    <tr>
      <td>\${ipLink(b.encodedIp)}</td>
      <td>\${esc(b.reason||'–')}</td>
      <td>\${esc(b.bannedBy||'–')}</td>
      <td>\${b.permanent ? '<span class="badge badge-perm">PERMANENT</span>' : '<span class="badge badge-temp">TEMP</span>'}</td>
      <td>\${b.permanent ? '∞' : fmtDate(b.expiresIn)}</td>
      <td><button class="btn btn-green btn-sm" onclick="unbanIp('\${esc(b.encodedIp)}')">Unban</button></td>
    </tr>
  \`).join('') : '<tr><td colspan="6" class="empty">No IP bans.</td></tr>';
}

function renderAccountBans(q) {
  const tbody = document.getElementById('account-ban-tbody');
  const rows = bansData.accountBans.filter(b =>
    !q || b.slug.includes(q) || b.username.toLowerCase().includes(q) || (b.banReason||'').toLowerCase().includes(q)
  );
  tbody.innerHTML = rows.length ? rows.map(b => \`
    <tr>
      <td>\${esc(b.slug)}</td>
      <td>\${esc(b.username)}</td>
      <td>\${esc(b.banReason||'–')}</td>
      <td>\${esc(b.bannedBy||'–')}</td>
      <td><button class="btn btn-green btn-sm" onclick="unbanAccount('\${esc(b.slug)}')">Unban</button></td>
    </tr>
  \`).join('') : '<tr><td colspan="5" class="empty">No account bans.</td></tr>';
}

function renderChatBans(q) {
  const tbody = document.getElementById('chat-ban-tbody');
  const rows = bansData.chatBans.filter(b =>
    !q || b.encodedIp.includes(q) || (b.reason||'').toLowerCase().includes(q) || (b.bannedBy||'').toLowerCase().includes(q)
  );
  tbody.innerHTML = rows.length ? rows.map(b => \`
    <tr>
      <td>\${ipLink(b.encodedIp)}</td>
      <td>\${esc(b.reason||'–')}</td>
      <td>\${esc(b.bannedBy||'–')}</td>
      <td>\${b.permanent ? '<span class="badge badge-perm">PERMANENT</span>' : '<span class="badge badge-temp">TEMP</span>'}</td>
      <td>\${b.permanent ? '∞' : fmtDate(b.expiresIn)}</td>
      <td><button class="btn btn-green btn-sm" onclick="unbanChat('\${esc(b.encodedIp)}')">Unban</button></td>
    </tr>
  \`).join('') : '<tr><td colspan="6" class="empty">No chat bans.</td></tr>';
}

document.getElementById('ban-search').addEventListener('input', renderBans);

async function unbanIp(ip) {
  try { await post('/api/unban/ip', { ip }); toast('IP entbannt'); }
  catch (e) { toast('Fehler beim Entbannen', true); }
}
async function unbanAccount(slug) {
  try { await post('/api/unban/account', { slug }); toast('Account entbannt'); }
  catch (e) { toast('Fehler beim Entbannen', true); }
}
async function unbanChat(ip) {
  try { await post('/api/unban/chat', { ip }); toast('Chat-Ban aufgehoben'); }
  catch (e) { toast('Fehler beim Entbannen', true); }
}

// ── New-ban modal ──────────────────────────────────────────────────────────

// Show/hide duration block + update target hint based on selected ban type
function onBanTypeChange() {
  const type = document.getElementById('modal-ban-type').value;
  const durationBlock = document.getElementById('modal-duration-block');
  const targetHint    = document.getElementById('modal-target-hint');
  durationBlock.style.display = type === 'account' ? 'none' : '';
  targetHint.textContent = type === 'account' ? '(account slug)' : '(IP hash)';
}

const banModal = document.getElementById('ban-modal');

document.getElementById('ban-new-btn').addEventListener('click', () => {
  // Reset form on open (no kick target)
  delete banModal.dataset.kickTarget;
  document.getElementById('modal-ban-target').value = '';
  document.getElementById('modal-ban-reason').value = '';
  document.getElementById('modal-ban-days').value   = '7';
  document.getElementById('modal-ban-days').disabled = false;
  document.getElementById('modal-ban-perm').checked = false;
  document.getElementById('modal-ban-type').value   = 'ip';
  onBanTypeChange();
  banModal.style.display = 'flex';
});

document.getElementById('modal-cancel-btn').addEventListener('click', () => { banModal.style.display = 'none'; });

document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
  const type   = document.getElementById('modal-ban-type').value;
  const target = document.getElementById('modal-ban-target').value.trim();
  const reason = document.getElementById('modal-ban-reason').value.trim();
  const perm   = document.getElementById('modal-ban-perm').checked;
  const days   = perm ? 36500 : (parseInt(document.getElementById('modal-ban-days').value) || 7);
  if (!target) return toast('Please specify a target!', true);
  try {
    if (type === 'ip')      await post('/api/ban/ip',      { ip: target, reason, duration: days, permanent: perm });
    if (type === 'account') await post('/api/ban/account', { slug: target, reason });
    if (type === 'chat')    await post('/api/ban/chat',    { ip: target, reason, duration: days, permanent: perm });

    // If opened from player list: also ban account + kick the player
    const kickTarget = banModal.dataset.kickTarget;
    if (kickTarget) {
      delete banModal.dataset.kickTarget;
      await post('/api/ban/account', { slug: kickTarget, reason });
      await gameCmd({ action: 'kick', target: kickTarget });
    }

    toast('Ban created ✓');
    banModal.style.display = 'none';
  } catch (e) { toast('Error: ' + e.message, true); }
});

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 – IP / PLAYER LOOKUP (plain REST, no SSE needed)
// ═══════════════════════════════════════════════════════════════════════════

function isIpHash(s) { return /^[0-9a-f]{64}$/.test(s); }

/** Loads and renders the recent-players quick-access table. */
async function loadRecent() {
  try {
    const data = await get('/api/recent');
    const tbody = document.getElementById('recent-tbody');
    const rows  = data.recent ?? [];
    tbody.innerHTML = rows.length ? rows.map(r => \`
      <tr style="cursor:pointer" onclick="lookupFromRecent('\${esc(r.username)}')">
        <td><span style="color:var(--blue-t)">\${esc(r.username)}</span></td>
        <td>\${r.slug ? esc(r.slug) : '<span style="color:var(--text-muted)">–</span>'}</td>
        <td>\${ipLink(r.encodedIp)}</td>
        <td>\${esc(r.isp || '–')}</td>
        <td>\${esc(r.region || '–')}</td>
        <td>\${fmtDate(r.createdAt)}</td>
      </tr>
    \`).join('') : '<tr><td colspan="6" class="empty">No recent players.</td></tr>';
  } catch { /* silently ignore */ }
}

/** Clicking a recent-list row fills the search box and runs the lookup. */
function lookupFromRecent(name) {
  document.getElementById('lookup-input').value = name;
  doLookup(name);
}

async function doLookup(query) {
  const res = document.getElementById('lookup-result');
  // Hide the recent list while a result is displayed
  document.getElementById('recent-block').style.display = 'none';
  res.innerHTML = '<div class="loading">Searching…</div>';
  try {
    if (isIpHash(query)) {
      renderIpDetail(await get('/api/ip/' + encodeURIComponent(query)), res);
    } else {
      renderPlayerDetail(await get('/api/player/' + encodeURIComponent(query)), res);
    }
  } catch (e) { res.innerHTML = '<div class="empty">No results found.</div>'; }
}

function renderIpDetail(data, container) {
  const banInfo = data.banned
    ? \`<span class="badge badge-perm">BANNED</span> \${esc(data.banRecord?.reason || '')}\`
    : '<span class="badge badge-alive">Clean</span>';
  const rows = (data.accounts || []).map(a => {
    const isHistorical = a.source === 'historical';
    const sourceBadge = isHistorical
      ? '<span class="badge" style="background:var(--surface3);color:var(--text-muted);border:1px solid var(--border2)">HISTORICAL</span>'
      : '<span class="badge badge-alive">RECENT</span>';
    return \`<tr>
      <td>\${esc(a.username)} \${sourceBadge}</td>
      <td>\${a.slug ? esc(a.slug) : '<span style="color:var(--text-muted)">–</span>'}</td>
      <td>\${esc(a.isp || '–')}</td>
      <td>\${esc(a.region || '–')}</td>
      <td>\${isHistorical ? '<span style="color:var(--text-muted)">via match history</span>' : fmtDate(a.createdAt)}</td>
    </tr>\`;
  }).join('');
  container.innerHTML = \`
    <div class="detail-card">
      <h3>IP Details</h3>
      <div class="kv-row"><span class="kv-key">Hash:</span><span class="kv-val">\${esc(data.hash)}</span></div>
      <div class="kv-row"><span class="kv-key">ISP:</span><span class="kv-val">\${esc(data.isp || 'Unknown')}</span></div>
      <div class="kv-row"><span class="kv-key">Ban status:</span><span>\${banInfo}</span></div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
        \${data.banned
          ? \`<button class="btn btn-green btn-sm" onclick="unbanIp('\${esc(data.hash)}')">Unban</button>\`
          : \`<button class="btn btn-red btn-sm" onclick="quickBanIp('\${esc(data.hash)}')">Ban IP</button>\`}
        <button class="btn btn-blue btn-sm" onclick="loadChatLog('\${esc(data.hash)}', 'ip', this)">💬 Chat History</button>
      </div>
      <div id="chat-log-panel" style="display:none;margin-top:10px;"></div>
    </div>
    <div style="margin-top:12px;">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Slug</th><th>ISP</th><th>Region</th><th>Last seen</th></tr></thead>
        <tbody>\${rows || '<tr><td colspan="5" class="empty">No entries.</td></tr>'}</tbody>
      </table>
    </div>
  \`;
}

function renderPlayerDetail(data, container) {
  const rows = (data.ips || []).map(ip => \`
    <tr>
      <td>\${ipLink(ip.ip)}</td>
      <td>\${esc(ip.isp || '–')}</td>
      <td>\${esc(ip.region || '–')}</td>
      <td>\${fmtDate(ip.lastSeen)}</td>
    </tr>
  \`).join('');
  container.innerHTML = \`
    <div class="detail-card">
      <h3>Player: <strong>\${esc(data.name)}</strong></h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">Known IPs – click a hash to see full details.</p>
      <div style="margin-top:8px;">
        <button class="btn btn-blue btn-sm" onclick="loadChatLog('\${esc(data.name)}', 'name', this)">💬 Chat History</button>
      </div>
    </div>
    <div id="chat-log-panel" style="display:none;margin-top:12px;"></div>
    <div style="margin-top:12px;">
      <table class="data-table">
        <thead><tr><th>IP Hash</th><th>ISP</th><th>Region</th><th>Last seen</th></tr></thead>
        <tbody>\${rows || '<tr><td colspan="4" class="empty">No IPs found.</td></tr>'}</tbody>
      </table>
    </div>
  \`;
}

const CHANNEL_LABELS = ['ALL', 'TEAM', 'SPEC'];
const CHANNEL_COLORS = ['var(--text)', 'var(--green-t)', 'var(--text-dim)'];

async function loadChatLog(query, by, btn) {
  const panel = document.getElementById('chat-log-panel');
  if (panel.style.display !== 'none') { panel.style.display = 'none'; if(btn) btn.textContent = '💬 Chat History'; return; }
  panel.style.display = '';
  if(btn) btn.textContent = '💬 Hide Chat History';
  panel.innerHTML = '<div class="loading">Loading chat history…</div>';
  try {
    const data = await get('/api/chat/' + encodeURIComponent(query) + '?by=' + by);
    const msgs = data.messages ?? [];
    if (!msgs.length) { panel.innerHTML = '<div class="empty">No chat messages found.</div>'; return; }
    panel.innerHTML = \`
      <table class="data-table">
        <thead><tr><th>Time</th><th>Name</th><th>Channel</th><th>Message</th><th>Game</th></tr></thead>
        <tbody>\${msgs.map(m => \`<tr>
          <td style="white-space:nowrap;font-size:11px;">\${fmtDate(m.createdAt)}</td>
          <td>\${esc(m.username)}\${m.slug ? \` <span style="color:var(--text-muted);font-size:10px;">(\${esc(m.slug)})</span>\` : ''}</td>
          <td><span style="font-size:10px;font-weight:600;color:\${CHANNEL_COLORS[m.channel] ?? 'var(--text)'};">\${CHANNEL_LABELS[m.channel] ?? m.channel}</span></td>
          <td>\${esc(m.message)}</td>
          <td style="font-family:monospace;font-size:10px;color:var(--text-muted);">\${esc((m.gameId||'').slice(0,8))}…</td>
        </tr>\`).join('')}</tbody>
      </table>
    \`;
  } catch { panel.innerHTML = '<div class="empty">Failed to load chat history.</div>'; }
}

function quickBanIp(hash) {
  // Pre-fill the ban modal and open it
  document.getElementById('modal-ban-type').value   = 'ip';
  document.getElementById('modal-ban-target').value = hash;
  document.getElementById('modal-ban-reason').value = '';
  document.getElementById('modal-ban-days').value   = '7';
  document.getElementById('modal-ban-days').disabled = false;
  document.getElementById('modal-ban-perm').checked = false;
  onBanTypeChange();
  banModal.style.display = 'flex';
}

document.getElementById('lookup-btn').addEventListener('click', () => {
  const q = document.getElementById('lookup-input').value.trim();
  if (q) { doLookup(q); } else {
    // Empty search → restore recent list
    document.getElementById('lookup-result').innerHTML = '';
    document.getElementById('recent-block').style.display = '';
  }
});
document.getElementById('lookup-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) doLookup(q); }
});

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 – LIVE SERVERS (receives "servers" + "players" events via SSE)
// ═══════════════════════════════════════════════════════════════════════════

function renderServers() {
  const list = document.getElementById('server-list');
  if (!serverData.regions?.length) { list.innerHTML = '<div class="empty">No regions found.</div>'; return; }

  list.innerHTML = serverData.regions.map(region => {
    const games = (region.games || []).filter(g => !g.stopped);
    const cardsHtml = games.length ? games.map((g) => {
      const isSelected = activeGameId === g.id;
      return \`<div class="game-card \${isSelected ? 'selected' : ''}" data-region="\${esc(region.regionId)}" data-id="\${esc(g.id)}" onclick="selectGame('\${esc(region.regionId)}','\${esc(g.id)}')">
        <div class="gc-id">\${esc(g.id.slice(0,8))}…</div>
        <div class="gc-mode">Mode \${esc(String(g.teamMode || '?'))}</div>
        <div class="gc-count">\${g.playerCount ?? '?'} players</div>
        <div style="margin-top:6px;">
          <button class="btn btn-blue btn-sm" style="width:100%" onclick="event.stopPropagation();spectateGame('\${esc(region.regionId)}','\${esc(g.id)}')">👁 SPECTATE</button>
        </div>
      </div>\`;
    }).join('') : '<div class="empty">No running games.</div>';

    const verifyBtn = region.verifiedOnly
      ? \`<button class="btn btn-red btn-sm" style="margin-left:auto" onclick="setServerVerified('\${esc(region.regionId)}', false)">UNVERIFY SERVER</button>\`
      : \`<button class="btn btn-green btn-sm" style="margin-left:auto" onclick="setServerVerified('\${esc(region.regionId)}', true)">VERIFY SERVER</button>\`;
    return \`<div class="region-block">
      <div class="region-header" style="display:flex;align-items:center;">Region: \${esc(region.regionId)}\${verifyBtn}</div>
      <div class="game-cards">\${cardsHtml}</div>
    </div>\`;
  }).join('');
}

/** Opens the game client in a new tab and auto-spectates the given game. */
async function spectateGame(region, gameId) {
  try {
    const data = await get('/api/game/' + encodeURIComponent(region) + '/' + encodeURIComponent(gameId) + '/spectate-token');
    const matchData = data?.res?.[0];
    if (!matchData) { toast('Could not get spectate token', true); return; }
    sessionStorage.setItem('dashboardSpectate', JSON.stringify(matchData));
    window.open('/', '_blank');
    toast('Opening spectator view…');
  } catch (e) { toast('Spectate failed', true); }
}

/** Selects a game and reconnects SSE with the gameId so player events start flowing. */
function selectGame(region, gameId) {
  activeGameRegion = region;
  activeGameId     = gameId;
  document.getElementById('gd-game-id').textContent = gameId.slice(0,8) + '…';
  document.getElementById('game-detail').style.display = '';
  closeAnnouncePanel();
  closeMsgPanel();
  const gameData = serverData.regions.find(r => r.regionId === region)?.games?.find(g => g.id === gameId);
  updateVerifyButtons(gameData?.verifiedOnly ?? false);
  currentPlayers = [];
  document.getElementById('player-tbody').innerHTML = '<tr><td colspan="6" class="loading">Lade…</td></tr>';

  // Re-open SSE with the selected gameId – server now streams player data too
  connectSSE(region, gameId);

  // Highlight selected card
  renderServers();
}

function renderPlayers() {
  // Pin admin's own game card if admin is in this game
  const adminInGame = currentPlayers.some(p => p.userId === currentAdminId);
  document.querySelectorAll('.game-card[data-id="' + activeGameId + '"]')
    .forEach(el => el.classList.toggle('pinned', adminInGame));

  const showDisc = document.getElementById('show-disconnected')?.checked ?? false;
  const visiblePlayers = showDisc
    ? currentPlayers
    : currentPlayers.filter(p => !p.disconnected);

  const tbody = document.getElementById('player-tbody');
  tbody.innerHTML = visiblePlayers.length ? visiblePlayers.map(p => {
    // Status badges: alive/dead + spectator (can be combined); disconnected overrides
    const aliveBadge = p.disconnected
      ? '<span class="badge badge-disc">DISCONNECTED</span>'
      : p.alive
        ? '<span class="badge badge-alive">ALIVE</span>'
        : '<span class="badge badge-dead">DEAD</span>';
    const specBadge  = !p.disconnected && p.isSpectator ? '<span class="badge badge-spec">SPECTATOR</span>' : '';
    const adminBadge = p.isAdmin ? '<span class="badge badge-admin">ADMIN</span>' : '';
    const isSelf     = p.userId === currentAdminId;
    const selfBadge  = isSelf ? '<span class="badge badge-self">YOU</span>' : '';
    // No kick/ban buttons for self or already-disconnected players
    const actionBtns = (isSelf || p.disconnected) ? '' : \`
        <button class="btn btn-red  btn-sm" onclick="gameCmd({action:'kick',target:'\${esc(p.username)}'})">KICK</button>
        <button class="btn btn-red  btn-sm" style="background:var(--red-dim)" onclick="quickBanPlayer('\${esc(p.username)}','\${esc(p.encodedIp)}')">BAN</button>\`;
    return \`<tr style="\${p.disconnected ? 'opacity:.5' : ''}">
      <td>\${esc(p.username)} \${adminBadge} \${selfBadge}</td>
      <td>\${ipLink(p.encodedIp)}</td>
      <td>\${p.kills ?? 0}</td>
      <td>\${p.assists ?? 0}</td>
      <td>\${aliveBadge}\${specBadge}</td>
      <td>\${actionBtns}
        \${!p.disconnected ? \`<button class="btn btn-blue btn-sm" onclick="openMsg('\${esc(p.username)}')">MSG</button>\` : ''}
      </td>
    </tr>\`;
  }).join('') : '<tr><td colspan="6" class="empty">No players.</td></tr>';
}

// ── Game-level commands ────────────────────────────────────────────────────

async function gameCmd(cmd) {
  if (!activeGameId) return;
  try {
    await post('/api/game/' + encodeURIComponent(activeGameRegion) + '/' + encodeURIComponent(activeGameId) + '/cmd', cmd);
    toast('Befehl gesendet ✓');
  } catch (e) { toast('Fehler: ' + e.message, true); }
}

// Global announce (all games across all regions)
document.getElementById('global-announce-open').addEventListener('click', () => {
  const panel = document.getElementById('global-announce-panel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('global-announce-cancel').addEventListener('click', () => {
  document.getElementById('global-announce-panel').style.display = 'none';
});
async function sendGlobalAnnounce() {
  const text  = document.getElementById('global-announce-input').value.trim();
  const color = document.getElementById('global-announce-color').value;
  if (!text) return;
  try {
    await post('/api/servers/announce', { text, color, sender: currentAdminSlug });
    toast('Announcement sent to all games ✓');
    document.getElementById('global-announce-input').value = '';
    document.getElementById('global-announce-panel').style.display = 'none';
  } catch (e) { toast('Error sending announcement', true); }
}
document.getElementById('global-announce-send').addEventListener('click', sendGlobalAnnounce);
document.getElementById('global-announce-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendGlobalAnnounce(); });

function updateVerifyButtons(isVerified) {
  activeGameVerified = isVerified;
  document.getElementById('ga-verify').style.display   = isVerified ? 'none' : '';
  document.getElementById('ga-unverify').style.display = isVerified ? '' : 'none';
}

document.getElementById('ga-verify').addEventListener('click', async () => {
  await gameCmd({ action: 'verify' });
  updateVerifyButtons(true);
});
document.getElementById('ga-unverify').addEventListener('click', async () => {
  await gameCmd({ action: 'unverify' });
  updateVerifyButtons(false);
});
document.getElementById('ga-freeze').addEventListener('click',   () => gameCmd({ action: 'freeze' }));
document.getElementById('ga-unfreeze').addEventListener('click', () => gameCmd({ action: 'unfreeze' }));

async function setServerVerified(region, state) {
  try {
    await post('/api/servers/' + encodeURIComponent(region) + (state ? '/verify' : '/unverify'), {});
    toast(state ? 'Server verified ✓' : 'Server unverified ✓');
  } catch (e) { toast('Error: ' + e.message, true); }
}

function closeAnnouncePanel() { document.getElementById('announce-panel').classList.remove('open'); }
document.getElementById('ga-announce-open').addEventListener('click', () => {
  closeMsgPanel();
  document.getElementById('announce-panel').classList.toggle('open');
});
document.getElementById('ga-announce-cancel').addEventListener('click', closeAnnouncePanel);
async function sendAnnounce() {
  const text  = document.getElementById('announce-input').value.trim();
  const color = document.getElementById('announce-color').value;
  if (!text) return;
  await gameCmd({ action: 'announce', text, color, sender: currentAdminSlug });
  document.getElementById('announce-input').value = '';
  closeAnnouncePanel();
}
document.getElementById('ga-announce-send').addEventListener('click', sendAnnounce);
document.getElementById('announce-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendAnnounce(); });

function openMsg(playerName) {
  msgTargetName = playerName;
  document.getElementById('msg-target-label').textContent = playerName;
  document.getElementById('msg-input').value = '';
  closeAnnouncePanel();
  document.getElementById('msg-panel').classList.add('open');
  document.getElementById('msg-input').focus();
}
function closeMsgPanel() { document.getElementById('msg-panel').classList.remove('open'); }
document.getElementById('msg-cancel-btn').addEventListener('click', closeMsgPanel);
async function sendMsg() {
  const text  = document.getElementById('msg-input').value.trim();
  const color = document.getElementById('msg-color').value;
  if (!text || !msgTargetName) return;
  await gameCmd({ action: 'announce_player', target: msgTargetName, text, color, sender: currentAdminSlug });
  document.getElementById('msg-input').value = '';
  closeMsgPanel();
}
document.getElementById('msg-send-btn').addEventListener('click', sendMsg);
document.getElementById('msg-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

/** Ban a player from the live game view: opens the modal pre-filled, kicks after confirm. */
function quickBanPlayer(name, hash) {
  document.getElementById('modal-ban-type').value   = 'ip';
  document.getElementById('modal-ban-target').value = hash;
  document.getElementById('modal-ban-reason').value = '';
  document.getElementById('modal-ban-days').value   = '7';
  document.getElementById('modal-ban-days').disabled = false;
  document.getElementById('modal-ban-perm').checked = false;
  onBanTypeChange();
  // Store the player name so the confirm handler can also ban the account + kick
  banModal.dataset.kickTarget = name;
  banModal.style.display = 'flex';
}

document.getElementById('gd-close-btn').addEventListener('click', () => {
  document.getElementById('game-detail').style.display = 'none';
  activeGameId = activeGameRegion = '';
  // Revert to server-only SSE (no player stream)
  connectSSE(null, null);
  renderServers();
});

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 – ACCOUNTS + XP
// ═══════════════════════════════════════════════════════════════════════════

let accountsData = [];
let accountsPassTypes = [];
let accountsSortCol = 'currentXp';
let accountsSortDir = -1; // -1 = desc, 1 = asc

function renderAccountsHeader() {
  const headerRow = document.getElementById('accounts-thead-row');
  // Remove any previously injected pass columns (keep static cols: #, Username, Slug, Created, Last IP, Flags = 6)
  while (headerRow.children.length > 6) headerRow.removeChild(headerRow.lastChild);
  for (const pt of accountsPassTypes) {
    const shortName = pt.replace('pass_survivr', 'S');
    const th = document.createElement('th');
    th.className = 'sortable';
    th.dataset.col = 'pass_' + pt;
    th.textContent = shortName + ' Lvl';
    headerRow.appendChild(th);
  }
  // Update sort arrows
  document.querySelectorAll('#accounts-table .sortable').forEach(th => {
    const col = th.dataset.col;
    const base = th.textContent.replace(/ [▲▼]$/, '');
    th.textContent = col === accountsSortCol ? base + (accountsSortDir === 1 ? ' ▲' : ' ▼') : base;
  });
}

async function loadAccounts() {
  const colCount = 6 + accountsPassTypes.length;
  document.getElementById('accounts-tbody').innerHTML = \`<tr><td colspan="\${colCount}" class="loading">Loading…</td></tr>\`;
  try {
    const data = await get('/api/accounts');
    accountsData = data.accounts ?? [];
    accountsPassTypes = data.passTypes ?? [];
    renderAccountsHeader();
    renderAccounts();
  } catch (e) {
    document.getElementById('accounts-tbody').innerHTML = '<tr><td colspan="6" class="empty">Failed to load accounts.</td></tr>';
  }
}

function renderAccounts() {
  const q = document.getElementById('accounts-search').value.toLowerCase();
  let rows = accountsData.filter(a =>
    !q || (a.username||'').toLowerCase().includes(q) || (a.slug||'').toLowerCase().includes(q)
  );

  // Sort
  rows = [...rows].sort((a, b) => {
    let av, bv;
    if (accountsSortCol.startsWith('pass_')) {
      const pt = accountsSortCol.slice(5);
      av = Number(a.passes?.[pt]?.level ?? -1);
      bv = Number(b.passes?.[pt]?.level ?? -1);
    } else if (accountsSortCol === 'userCreated') {
      av = a.userCreated ? new Date(a.userCreated).getTime() : -1;
      bv = b.userCreated ? new Date(b.userCreated).getTime() : -1;
    } else {
      av = (a[accountsSortCol] ?? '').toString().toLowerCase();
      bv = (b[accountsSortCol] ?? '').toString().toLowerCase();
    }
    if (av < bv) return -accountsSortDir;
    if (av > bv) return  accountsSortDir;
    return 0;
  });

  // Update header arrows
  document.querySelectorAll('#accounts-table .sortable').forEach(th => {
    const col = th.dataset.col;
    const base = th.textContent.replace(/ [▲▼]$/, '');
    th.textContent = col === accountsSortCol ? base + (accountsSortDir === 1 ? ' ▲' : ' ▼') : base;
  });

  const passCols = accountsPassTypes.map(pt =>
    \`<td style="font-weight:600;text-align:center;">\${a_passes_level(a, pt)}</td>\`
  );

  const colCount = 6 + accountsPassTypes.length;
  const tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = rows.length ? rows.map((a, i) => \`
    <tr>
      <td style="color:var(--text-muted);font-size:11px;">\${i+1}</td>
      <td><span style="color:var(--blue-t)">\${esc(a.username||'–')}</span></td>
      <td style="font-size:11px;color:var(--text-dim);">\${esc(a.slug||'–')}</td>
      <td style="font-size:11px;color:var(--text-muted);white-space:nowrap;">\${fmtDate(a.userCreated)}</td>
      <td style="font-size:11px;font-family:monospace;">\${a.lastIp ? ipLink(a.lastIp) : '–'}</td>
      <td>
        \${a.admin ? '<span class="badge badge-admin">ADMIN</span>' : ''}
        \${a.banned ? '<span class="badge badge-perm">BANNED</span>' : ''}
      </td>
      \${accountsPassTypes.map(pt => \`<td style="font-weight:600;text-align:center;">\${a.passes?.[pt]?.level ?? '–'}</td>\`).join('')}
    </tr>
  \`).join('') : \`<tr><td colspan="\${colCount}" class="empty">No accounts found.</td></tr>\`;
}

// Helper to suppress template-literal reference error (resolved inline above)
function a_passes_level(a, pt) { return a.passes?.[pt]?.level ?? '–'; }

document.getElementById('accounts-search').addEventListener('input', renderAccounts);

document.getElementById('accounts-table').addEventListener('click', (e) => {
  const th = e.target.closest('th.sortable');
  if (!th) return;
  const col = th.dataset.col;
  if (accountsSortCol === col) {
    accountsSortDir *= -1;
  } else {
    accountsSortCol = col;
    accountsSortDir = (col.startsWith('pass_') || col === 'userCreated') ? -1 : 1;
  }
  renderAccounts();
  renderAccountsHeader();
});

document.getElementById('reconcile-btn').addEventListener('click', async () => {
  const btn = document.getElementById('reconcile-btn');
  const result = document.getElementById('reconcile-result');
  btn.disabled = true;
  btn.textContent = '⏳ Running…';
  result.textContent = '';
  try {
    const data = await post('/api/reconcile_pass_xp', {});
    result.textContent = \`Done: \${data.usersReconciled} users fixed, +\${data.totalXpAdded} XP, \${data.totalUnlocksGranted} unlocks granted\`;
    result.style.color = 'var(--green-t)';
    await loadAccounts();
  } catch (e) {
    result.textContent = 'Error: ' + e.message;
    result.style.color = 'var(--red-t)';
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ Reconcile All Passes + Unlocks';
  }
});

// ── Admin chat send ────────────────────────────────────────────────────────

document.getElementById('chat-send-btn').addEventListener('click', async () => {
  const input = document.getElementById('chat-send-input');
  const text = input.value.trim();
  if (!text || !activeGameId) return;
  input.value = '';
  await gameCmd({ action: 'chat', text, sender: currentAdminSlug || 'ADMIN' });
});

document.getElementById('chat-send-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('chat-send-btn').click();
});

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════

(async () => {
  try {
    const me = await get('/api/me');
    currentAdminId   = me.id;
    currentAdminSlug = me.slug;
    document.getElementById('topbar-user').textContent = 'Logged in as ' + (me.username || me.slug);
  } catch { /* already redirected by server */ }

  // Open initial SSE stream (covers both bans tab and basic server info)
  connectSSE(null, null);
})();
</script>
</body>
</html>`;
