export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Slack webhook not configured' });
  }
  const d = req.body;
  const fmt = (val) => {
    if (!val || (Array.isArray(val) && val.length === 0)) return '未回答';
    return Array.isArray(val) ? val.join('、') : val;
  };
  const priorityFields = [
    { label: '① 家賃', key: 'priority_rent' },
    { label: '② 間取り', key: 'priority_layout' },
    { label: '③ 専有面積', key: 'priority_area_size' },
    { label: '④ 築年数', key: 'priority_age' },
    { label: '⑤ エリア・沿線', key: 'priority_location' },
    { label: '⑥ 駅徒歩', key: 'priority_walk' },
  ];
  const priorityText = priorityFields
    .map(p => d[p.key] ? p.label + '：' + d[p.key] : null)
    .filter(Boolean).join('\n');
  const text = '🏠 *新しいヒアリングフォームが届きました！*\n\n' +
    '*【基本情報】*\n' +
    '• お名前：' + fmt(d.name) + '（' + fmt(d.furigana) + '）\n' +
    '• LINE表示名：' + fmt(d.line_name) + '\n' +
    '• 電話番号：' + fmt(d.phone) + '\n' +
    '• 職業：' + fmt(d.occupation) + '\n\n' +
    '*【お引越し予定】*\n' +
    '• 希望時期：' + fmt(d.move_timing) + '\n' +
    '• 現住居の退去日：' + fmt(d.vacancy_date) + '\n' +
    '• 引越しの理由：' + fmt(d.reason) + '\n\n' +
    '*【希望エリア】*\n' +
    '• エリア・沿線：' + fmt(d.area) + '\n' +
    '• 駅からの徒歩：' + fmt(d.walk_min) + '\n\n' +
    '*【お部屋の条件】*\n' +
    '• 物件種目：' + fmt(d.property_type) + '\n' +
    '• 間取り：' + fmt(d.layout) + '\n' +
    '• 専有面積（下限）：' + (fmt(d.min_area) || 'こだわらない') + '\n' +
    '• 家賃上限：' + (d.rent_max ? Number(d.rent_max).toLocaleString() + '円' : '未回答') + '\n' +
    '• 築年数：' + fmt(d.building_age) + '\n' +
    '• 建物構造：' + fmt(d.structure) + '\n' +
    '• 絶対条件：' + fmt(d.must) + '\n' +
    '• 希望条件：' + fmt(d.nice) + '\n\n' +
    '*【初期費用・その他】*\n' +
    '• 初期費用の予算感：' + fmt(d.initial_budget) + '\n' +
    '• ライフラインまとめ契約：' + fmt(d.lifeline) + '\n\n' +
    '*【優先順位】*\n' +
    (priorityText || '未回答') + '\n\n' +
    '*【気になる物件URL】*\n' +
    fmt(d.property_urls) + '\n\n' +
    '*【その他・ご要望】*\n' +
    fmt(d.free_text);
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Slack returned an error' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
