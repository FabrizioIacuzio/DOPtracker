"""
Reads scripts/submission_methods.csv and generates one JSON config per denomination.
Run from repo root: python scripts/seed_denomination_configs.py
Output files are scaffolds — replace all 'TODO:' labels before committing.
"""
import csv, json, os, re
from collections import defaultdict

SRC  = os.path.join(os.path.dirname(__file__), "submission_methods.csv")
OUT  = os.path.join(os.path.dirname(__file__), "..", "backend", "src", "denominations", "configs")

CHANNEL_MAP = {"pec":"pec","email":"email","web_portal":"web_portal",
               "telematic_sian":"telematic_sian","fax":"fax","pdf_format":"pdf_format"}

CSQA_BODY = {"name":"CSQA Certificazioni Srl","type":"csqa",
             "pec":"regolamentato@pec.csqa.it","email":"regolamentato@csqa.it",
             "address":"via S. Gaetano, 74, 36016 Thiene (VI)"}

# Note: pec/email omitted intentionally — empty strings fail Zod email() validation
CHECK_FRUIT_BODY = {"name":"Check Fruit S.r.l.","type":"check_fruit",
                    "address":""}

IGP = {"aceto-balsamico-di-modena","aglio-bianco-polesano","amarene-brusche-di-modena",
       "asparago-bianco-di-bassano","asparago-bianco-di-cimadolmo","asparago-di-badoere",
       "bresaola-della-valtellina","ciliegia-di-marostica","fagiolo-di-lamon-della-vallata-bellunese",
       "insalata-di-lusia","marrone-di-combai","marrone-di-san-zeno","marroni-del-monfenera",
       "mela-di-valtellina","pera-mantovana","pesca-di-verona","radicchio-di-chioggia",
       "radicchio-di-verona","radicchio-rosso-di-treviso","radicchio-variegato-di-castelfranco",
       "uva-da-tavola-di-canicatti"}

VALID_DOC = {"lab_analysis","register","declaration","notification","application_form",
             "self_monitoring","label","document_generic"}

def slug_name(s): return " ".join(w.capitalize() for w in s.replace("-"," ").split())

def infer_body(recipients):
    parts = [r.strip() for r in recipients.split("|")]
    if "check_fruit" in parts: return dict(CHECK_FRUIT_BODY)
    return dict(CSQA_BODY)

def parse_channels(s): return [c.strip() for c in s.split("|") if c.strip() in CHANNEL_MAP]

def parse_docs(s):
    parts = [p.strip() for p in s.split("|") if p.strip()]
    valid = [p for p in parts if p in VALID_DOC]
    return valid or ["document_generic"]

rows: dict = defaultdict(list)
with open(SRC, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        # Strip BOM from product key if present
        product = row.get("product") or row.get("﻿product") or ""
        product = product.strip()
        if product:
            rows[product].append(row)

os.makedirs(OUT, exist_ok=True)
for product, prows in sorted(rows.items()):
    dtype = "IGP" if product in IGP else "DOP"
    best  = next((r for r in prows if r.get("recipients")), prows[0])
    body  = infer_body(best.get("recipients","csqa"))
    seen, rules = set(), []
    for i, row in enumerate(prows):
        channels = parse_channels(row.get("channels",""))
        if not channels: continue
        doc = parse_docs(row.get("doc_types",""))[0]
        ch  = channels[0]
        if (ch, doc) in seen: continue
        seen.add((ch, doc))
        automated = ch in ("pec","email","pdf_format")
        instructions = None if automated else (
            "Accedere al portale dedicato dell'organismo di controllo e caricare la documentazione."
            if ch == "web_portal" else
            "Accedere al SIAN con le proprie credenziali e trasmettere la comunicazione prevista."
            if ch == "telematic_sian" else
            "Inviare il documento all'organismo di controllo secondo le modalità previste.")
        schedule = {"frequency":"monthly","due_day":15} if doc in ("notification","register","document_generic") else None
        rules.append({
            "id": f"rule-{i+1:02d}-{ch}-{doc}".replace("_","-"),
            "doc_type": doc,
            "label": f"TODO: {doc.replace('_',' ').title()} ({ch})",
            "channel": ch,
            "automation": "automated" if automated else "manual",
            "recipient": (best.get("recipients","csqa") or "csqa").split("|")[0].strip() or "csqa",
            "schedule": schedule,
            "instructions": instructions,
        })
    cfg = {"id":product,"name":f"{slug_name(product)} {dtype}","type":dtype,
           "control_body":body,"submission_rules":rules}
    with open(os.path.join(OUT, f"{product}.json"),"w",encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f"  OK {product}.json")

# Stubs for products with no rules detected
STUBS = ["amarene-brusche-di-modena","bresaola-della-valtellina","chianti-classico",
         "marrone-di-combai","marrone-di-san-zeno","salmerino-del-trentino",
         "sopressa-vicentina","susina-di-dro","valle-daosta-fromadzo"]
for slug in STUBS:
    if slug in rows: continue
    dtype = "IGP" if slug in IGP else "DOP"
    cfg = {"id":slug,"name":f"{slug_name(slug)} {dtype}","type":dtype,
           "control_body":dict(CSQA_BODY),"submission_rules":[]}
    with open(os.path.join(OUT,f"{slug}.json"),"w",encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f"  OK {slug}.json (stub)")

print("\nDone. Replace all 'TODO:' labels with Italian text before committing.")
