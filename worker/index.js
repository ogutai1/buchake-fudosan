// ぶっちゃけ不動産 HP（Cloudflare Workers）。静的ページを配信し、www なしで来たら www 付きへ転送する。
// ヒアリングフォームは物件提案システム（bukken-teian、mypage.bucchake-fudosan.com）に移行済み。
const APEX = "bucchake-fudosan.com";
const CANONICAL = "www.bucchake-fudosan.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === APEX) {
      url.hostname = CANONICAL;
      return Response.redirect(url.toString(), 308);
    }
    return env.ASSETS.fetch(request);
  },
};
