// Altere para o e-mail do seu time de suporte.
const SUPPORT_EMAIL = "suporte@exemplo.com";

export function renderErrorPage(errorId: string): string {
  const safeId = errorId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Algo deu errado</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1rem; }
      .id-box { text-align: left; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem; margin: 1rem 0 1.25rem; }
      .id-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem; }
      .id-value { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; color: #111; word-break: break-all; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      button, a.btn { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      .copied { color: #047857; font-size: 0.8rem; margin-top: 0.5rem; min-height: 1.2em; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Algo deu errado</h1>
      <p>Encontramos um problema ao carregar esta página. Envie o Error ID abaixo para o suporte para investigarmos.</p>
      <div class="id-box">
        <p class="id-label">Error ID</p>
        <div class="id-value" id="eid">${safeId}</div>
      </div>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Tentar novamente</button>
        <button class="secondary" id="copy-btn">Copiar detalhes</button>
        <a class="btn secondary" id="support-btn" href="mailto:${SUPPORT_EMAIL}">Falar com o suporte</a>
        <a class="btn secondary" href="/">Ir para o início</a>
      </div>
      <div class="copied" id="copy-status"></div>
    </div>
    <script>
      (function () {
        var btn = document.getElementById('copy-btn');
        var status = document.getElementById('copy-status');
        var supportBtn = document.getElementById('support-btn');
        var buildDetails = function () {
          return [
            'Error ID: ${safeId}',
            'Rota: ' + location.pathname + location.search,
            'Horário: ' + new Date().toISOString(),
            'User-Agent: ' + navigator.userAgent,
          ].join('\\n');
        };
        if (supportBtn) {
          var subject = 'Erro na aplicação — ${safeId}';
          var body = 'Olá, encontrei um erro na aplicação.\\n\\n' + buildDetails() + '\\n\\nDescreva o que estava fazendo quando o erro ocorreu:\\n';
          supportBtn.href = 'mailto:${SUPPORT_EMAIL}?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        }
        btn.addEventListener('click', function () {
          var details = buildDetails();
          var done = function () {
            status.textContent = 'Copiado!';
            setTimeout(function () { status.textContent = ''; }, 2000);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(details).then(done, function () { status.textContent = 'Não foi possível copiar'; });
          } else {
            var ta = document.createElement('textarea');
            ta.value = details; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { status.textContent = 'Não foi possível copiar'; }
            document.body.removeChild(ta);
          }
        });
      })();
    </script>
  </body>
</html>`;
}
