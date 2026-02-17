import numpy as np
from flask import Blueprint, request, jsonify

ccc_bp = Blueprint('ccc', __name__)

# Defaults (request-local overrides supported via body.thresholds)
DEFAULT_POS_DELTA_THRESHOLD = 10.0   # mean(after - before) ≥ +10 → boosted
DEFAULT_NEG_DELTA_THRESHOLD = -10.0  # mean(after - before) ≤ -10 → lowered
DEFAULT_MIN_PAIRED_LOGS     = 1      # require at least 1 paired log per activity
DEFAULT_MIN_CCC             = 0.20   # agreement gate; set 0 to disable
DEFAULT_SCALE_FACTOR        = 20.0   # map intensity(1..5) to 20..100 per valence


def _to_float_array(arr):
    a = np.asarray(arr, dtype=float)
    return a[~np.isnan(a) & ~np.isinf(a)]


def _signed(valence, intensity, scale_factor):
    # valence: 'positive' | 'negative' | 'neutral'
    # intensity: 1..5
    if intensity is None:
        return None
    v = (valence or '').lower()
    if v == 'positive':
        s = +1
    elif v == 'negative':
        s = -1
    else:
        s = 0
    return float(s * float(intensity) * float(scale_factor))


def _extract_pairs(payload, scale_factor):
    """
    Accepts flexible formats per activity:
      - [{"beforeValence": "positive", "beforeIntensity": 3,
          "afterValence": "negative",  "afterIntensity": 2}, ...]
      - {"before": [signed_before...], "after": [signed_after...]}
      - [[signed_before, signed_after], ...]
    Returns (before[], after[])
    """
    if isinstance(payload, dict):
        # numeric arrays provided
        b = payload.get('before')
        a = payload.get('after')
        if isinstance(b, (list, tuple)) and isinstance(a, (list, tuple)):
            return list(b), list(a)

    if isinstance(payload, (list, tuple)):
        bs, as_ = [], []
        for item in payload:
            if isinstance(item, dict):
                # raw mood log with valence+intensity
                b = _signed(item.get('beforeValence'), item.get('beforeIntensity'), scale_factor)
                a = _signed(item.get('afterValence'),  item.get('afterIntensity'),  scale_factor)
            elif isinstance(item, (list, tuple)) and len(item) >= 2:
                # numeric pair [before, after]
                b, a = item[0], item[1]
            else:
                b, a = None, None

            if b is not None and a is not None:
                bs.append(b)
                as_.append(a)
        return bs, as_

    return [], []


def _ccc(x, y):
    """Concordance Correlation Coefficient."""
    x = _to_float_array(x)
    y = _to_float_array(y)
    n = min(len(x), len(y))
    if n < 2:
        return None
    x = x[:n]
    y = y[:n]
    mx = float(np.mean(x))
    my = float(np.mean(y))
    vx = float(np.var(x, ddof=1))
    vy = float(np.var(y, ddof=1))
    cov = float(np.cov(x, y, ddof=1)[0, 1])
    denom = vx + vy + (mx - my) ** 2
    if denom <= 0:
        return None
    return float((2.0 * cov) / denom)


def _classify(mean_delta, n, ccc, pos_th, neg_th, min_pairs, min_ccc):
    # Single paired log: classify by delta only (CCC not applicable)
    if n == 1:
        if mean_delta >= pos_th:
            return 'boosted'
        if mean_delta <= neg_th:
            return 'lowered'
        return 'neutral'

    # For n >= 2, use CCC as reliability gate
    if n < min_pairs:
        return None
    if min_ccc and (ccc is None or ccc < min_ccc):
        return 'neutral'
    if mean_delta >= pos_th:
        return 'boosted'
    if mean_delta <= neg_th:
        return 'lowered'
    return 'neutral'


def analyze_category(groups, cfg):
    """
    groups: { activity: payload } where payload is any accepted format.
    Returns labels and top lists.
    """
    included, ignored = [], []
    groupCounts, groupMeans, labels = {}, {}, {}
    all_b, all_a = [], []

    pos_th = float(cfg["pos"])
    neg_th = float(cfg["neg"])
    min_pairs = int(cfg["minPairs"])
    min_ccc = float(cfg["minCcc"])
    scale_factor = float(cfg["scale"])

    for activity, payload in (groups or {}).items():
        b_raw, a_raw = _extract_pairs(payload, scale_factor)
        b = _to_float_array(b_raw)
        a = _to_float_array(a_raw)
        n = min(len(b), len(a))

        if n < min_pairs:
            ignored.append(activity)
            continue

        b = b[:n]
        a = a[:n]
        deltas = a - b
        mean_delta = float(np.mean(deltas))
        ccc_val = _ccc(b, a)
        label = _classify(mean_delta, n, ccc_val, pos_th, neg_th, min_pairs, min_ccc)

        if label is None:
            ignored.append(activity)
            continue

        included.append(activity)
        groupCounts[activity] = n
        groupMeans[activity] = round(mean_delta, 2)
        labels[activity] = label

        all_b.extend(b.tolist())
        all_a.extend(a.tolist())

    entries = [(act, groupMeans[act]) for act in included]
    topPositive = [
        {"activity": act, "moodScore": m}
        for act, m in sorted(entries, key=lambda x: x[1], reverse=True)
        if m > 0
    ]
    topNegative = [
        {"activity": act, "moodScore": m}
        for act, m in sorted(entries, key=lambda x: x[1])
        if m < 0
    ]

    overall_ccc = _ccc(all_b, all_a) if len(all_b) >= 2 and len(all_a) >= 2 else None

    return {
        "success": len(included) > 0,
        "includedGroups": included,
        "ignoredGroups": ignored,
        "groupCounts": groupCounts,
        "groupMeans": groupMeans,
        "labels": labels,
        "topPositive": topPositive,
        "topNegative": topNegative,
        "overall": {"ccc": overall_ccc} if overall_ccc is not None else None,
        "insufficient": len(included) == 0,
        "message": "Not enough paired logs to analyze." if len(included) == 0 else None,
    }


@ccc_bp.route('/api/concordance/run', methods=['POST'])
def run_ccc():
    """
    Body:
    {
      "data": {
        "activity": { ... },
        "social": { ... },
        "health": { ... }
      },
      "thresholds": { "pos": 10, "neg": -10, "minPairs": 2, "minCcc": 0.2, "scale": 20 }
    }
    """
    body = request.get_json(silent=True) or {}
    data = body.get("data")
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Missing data"}), 400

    th = body.get("thresholds") or {}
    cfg = {
        "pos": float(th.get("pos", DEFAULT_POS_DELTA_THRESHOLD)),
        "neg": float(th.get("neg", DEFAULT_NEG_DELTA_THRESHOLD)),
        "minPairs": int(th.get("minPairs", DEFAULT_MIN_PAIRED_LOGS)),
        "minCcc": float(th.get("minCcc", DEFAULT_MIN_CCC)),
        "scale": float(th.get("scale", DEFAULT_SCALE_FACTOR)),
    }

    results = {}
    any_success = False
    for category, groups in data.items():
        cat_res = analyze_category(groups, cfg)
        results[category] = cat_res
        any_success = any_success or cat_res["success"]

    return jsonify({"success": any_success, "results": results}), 200