const API = "https://api.github.com";

/** Пути, которые считаются «контентом» для истории/экспорта/отката. */
export const CONTENT_PATHS = ["src/_data", "src/content", "src/uploads"];

async function request(config, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.botToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

export function getBranchHeadSha(config, branch) {
  return request(config, "GET", `/repos/${config.repo}/git/ref/heads/${branch}`).then(
    (ref) => ref.object.sha,
  );
}

export function getCommit(config, sha) {
  return request(config, "GET", `/repos/${config.repo}/git/commits/${sha}`);
}

export function getTree(config, treeSha) {
  return request(config, "GET", `/repos/${config.repo}/git/trees/${treeSha}?recursive=1`);
}

export function createTree(config, { baseTree, tree }) {
  return request(config, "POST", `/repos/${config.repo}/git/trees`, { base_tree: baseTree, tree });
}

export function createCommit(config, { message, tree, parents }) {
  return request(config, "POST", `/repos/${config.repo}/git/commits`, { message, tree, parents });
}

export function updateRef(config, branch, sha) {
  return request(config, "PATCH", `/repos/${config.repo}/git/refs/heads/${branch}`, { sha });
}

/** Коммиты в branch, затронувшие файлы под path (папка или файл), максимум per_page штук. */
export function listCommitsForPath(config, { branch, path, perPage = 20 }) {
  const params = new URLSearchParams({ sha: branch, path, per_page: String(perPage) });
  return request(config, "GET", `/repos/${config.repo}/commits?${params}`);
}

const ZIP_HEADERS = (config) => ({
  Authorization: `Bearer ${config.botToken}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

/**
 * Архив ветки репозитория (для экспорта, Задача 4.2). GitHub отвечает
 * редиректом на codeload.github.com — а fetch по умолчанию снимает
 * заголовок Authorization при редиректе на другой хост (это поведение
 * самого fetch, не наша дыра). Поэтому редирект не доверяем автоследованию:
 * читаем Location вручную и повторяем запрос со своим токеном — так архив
 * скачивается и для приватных репозиториев тоже.
 */
export async function downloadRepoZip(config, branch) {
  const first = await fetch(`${API}/repos/${config.repo}/zipball/${branch}`, {
    headers: ZIP_HEADERS(config),
    redirect: "manual",
  });

  if (first.status >= 300 && first.status < 400 && first.headers.get("location")) {
    const res = await fetch(first.headers.get("location"), { headers: ZIP_HEADERS(config) });
    if (!res.ok) throw new Error(`GitHub API GET /zipball/${branch} (redirect) → ${res.status}`);
    return res;
  }

  if (!first.ok) {
    throw new Error(`GitHub API GET /zipball/${branch} → ${first.status}`);
  }
  return first;
}
