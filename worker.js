/* ============================================================
   So Many Pelicans · 访客计数 Worker
   用途：给静态网站提供一个公开访问计数器（可设起始数）
   费用：Cloudflare Workers 免费版每天 10 万次请求，够用

   部署步骤（在 Cloudflare 控制台操作）：
   1. Workers & Pages → Create → Worker → 起名 somanypelicans-counter → Deploy
   2. 点进这个 Worker → Settings → Variables and Secrets →
      KV Namespace Bindings → Add binding：
        Variable name 填  VISITS
        KV namespace   新建一个，起名 pelican-visits
   3. 回到 Worker → Edit code → 把本文件内容全部粘贴进去 → Save and deploy
   4. 左侧 Storage & databases（或 Workers & Pages → KV）→
      打开 pelican-visits → Add entry：
        key    填  total
        value  填  1305        ← 起始数量，和网站里的 COUNTER_START 保持一致
   5. 记下 Worker 的访问地址（Worker 页面顶部会显示），形如
        https://somanypelicans-counter.你的子域名.workers.dev
      把它填进网站 index.html 里的 COUNTER_API，重新上传 index.html 即可
   ============================================================ */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // 当前计数值（KV 里没有就从 0 开始；正常你已手动设好起始数）
    let count = parseInt((await env.VISITS.get("total")) || "0", 10);

    // 每次请求 /hits 就 +1 并写回；直接打开 Worker 根地址只读取不计数
    if (url.pathname === "/hits" || url.pathname === "/hits/") {
      count += 1;
      await env.VISITS.put("total", String(count));
    }

    return Response.json(
      { count },
      {
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  },
};
