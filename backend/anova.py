import numpy as np
from scipy.stats import f_oneway
from flask import Flask, request, jsonify
from flask_cors import CORS
from statsmodels.stats.multicomp import pairwise_tukeyhsd

app = Flask(__name__)
CORS(app)

def safe_number(val):
    if isinstance(val, (float, np.floating)) and (np.isnan(val) or np.isinf(val)):
        return None
    return val

def compute_anova(original_groups):
    filtered_groups = {k: v for k, v in original_groups.items() if len(v) >= 2}
    if len(filtered_groups) < 2:
        return None

    groups_values = list(filtered_groups.values())

    try:
        F_value, p_value = f_oneway(*groups_values)
    except Exception:
        F_value, p_value = float('nan'), float('nan')

    all_values = [x for arr in filtered_groups.values() for x in arr]
    overall_mean = np.mean(all_values) if all_values else 0.0

    SSB = sum(len(vals) * (np.mean(vals) - overall_mean) ** 2 for vals in filtered_groups.values())
    df_between = len(filtered_groups) - 1
    MSB = SSB / df_between if df_between > 0 else None

    SSW = sum(np.sum((np.array(vals) - np.mean(vals)) ** 2) for vals in filtered_groups.values())
    df_within = len(all_values) - len(filtered_groups)
    MSW = SSW / df_within if df_within > 0 else None

    group_means = {k: round(float(np.mean(v)), 2) for k, v in filtered_groups.items()}
    group_counts = {k: len(v) for k, v in filtered_groups.items()}

    tukey_results = []
    tukey_info = {
        "groupSizes": group_counts,
        "groupVariances": {k: (float(np.var(v, ddof=1)) if len(v) > 1 else None) for k, v in filtered_groups.items()},
        "ran": False,
        "error": None,
        "skippedReason": None
    }

    try:
        data = []
        labels = []
        for g_name, vals in filtered_groups.items():
            for val in vals:
                data.append(val)
                labels.append(g_name)

        unique_groups = len(set(labels))
        if unique_groups < 2:
            tukey_info["skippedReason"] = "Less than 2 groups"
        elif len(data) <= unique_groups:
            tukey_info["skippedReason"] = "Not enough total observations"
        elif all(np.var(filtered_groups[g], ddof=1) == 0 for g in filtered_groups if len(filtered_groups[g]) > 1):
            tukey_info["skippedReason"] = "Zero variance in all groups"
        else:
            tukey = pairwise_tukeyhsd(endog=np.array(data), groups=np.array(labels), alpha=0.05)
            for res in tukey.summary().data[1:]:
                meandiff, padj, lower, upper, reject = res[2], res[3], res[4], res[5], res[6]
                entry = {
                    "group1": res[0],
                    "group2": res[1],
                    "meandiff": safe_number(round(float(meandiff), 2)),
                    "p_adj": safe_number(round(float(padj), 4)),
                    "p-adj": safe_number(round(float(padj), 4)),
                    "lower": safe_number(round(float(lower), 2)),
                    "upper": safe_number(round(float(upper), 2)),
                    "reject": bool(reject)
                }
                tukey_results.append(entry)
            tukey_info["ran"] = True
    except Exception as e:
        tukey_info["error"] = str(e)

    return {
        "F_value": safe_number(round(F_value, 4)) if F_value is not None else None,
        "p_value": safe_number(round(p_value, 6)) if p_value is not None else None,
        "MSB": safe_number(round(MSB, 4)) if MSB is not None else None,
        "MSW": safe_number(round(MSW, 4)) if MSW is not None else None,
        "groupMeans": group_means,
        "groupCounts": group_counts,
        "tukeyHSD": tukey_results,
        "tukeyInfo": tukey_info
    }

@app.route('/api/run-anova', methods=['POST'])
def run_anova():
    body = request.get_json()
    if "data" not in body:
        return jsonify({"success": False, "error": "Missing data"}), 400

    categories = body["data"]
    results = {}

    for category, groups in categories.items():
        anova_output = compute_anova(groups)
        if anova_output is None:
            results[category] = {
                "success": False,
                "message": "Logs are still insufficient to run a proper analysis. Come back later!",
                "ignoredGroups": [k for k, v in groups.items() if len(v) < 2]
            }
            continue

        interpretation = (
            "Some activities showed different mood impacts."
            if anova_output["p_value"] is not None and anova_output["p_value"] < 0.05
            else "Activities had similar mood impacts."
        )

        results[category] = {
            "success": True,
            **anova_output,
            "interpretation": interpretation,
            "includedGroups": list(anova_output["groupMeans"].keys()),
            "ignoredGroups": [k for k, v in groups.items() if len(v) < 2]
        }

    if all(not v.get("success") for v in results.values()):
        return jsonify({
            "success": False,
            "message": "Logs are still insufficient to run a proper analysis. Come back later!",
            "results": results
        })

    return jsonify({"success": True, "results": results})

if __name__ == '__main__':
    app.run(port=5001, host='0.0.0.0')