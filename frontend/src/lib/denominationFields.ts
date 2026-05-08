export type FieldType = 'number' | 'text' | 'date' | 'select'

export interface DenominationField {
  key: string
  label: string
  type: FieldType
  unit?: string
  hint?: string
  options?: string[]
  min?: number
  max?: number
  required?: boolean
}

export interface ValidationRule {
  field: string
  label: string
  min?: number
  max?: number
  unit?: string
}

export interface DenominationConfig {
  fields: DenominationField[]
  rules: ValidationRule[]
}

const CHEESE_COMMON: DenominationField[] = [
  { key: 'milk_liters', label: 'Latte utilizzato', type: 'number', unit: 'L', required: true },
  { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%' },
  { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni' },
  { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg' },
]

const FRUIT_COMMON: DenominationField[] = [
  { key: 'harvest_date', label: 'Data raccolta', type: 'date', required: true },
  { key: 'total_weight_kg', label: 'Peso produzione', type: 'number', unit: 'kg', required: true },
]

export const DENOMINATION_CONFIGS: Record<string, DenominationConfig> = {

  // ── ACETO ────────────────────────────────────────────────────────────────────
  'aceto-balsamico-di-modena': {
    fields: [
      { key: 'supplier', label: 'Fornitore mosto', type: 'text' },
      { key: 'volume', label: 'Volume', type: 'number', unit: 'L', required: true },
      { key: 'acidity', label: 'Acidità totale', type: 'number', unit: '%', hint: 'Min 6%' },
      { key: 'density', label: 'Densità a 20°C', type: 'number', unit: 'g/ml', hint: 'Min 1.06 g/ml' },
      { key: 'sugars', label: 'Zuccheri riduttori', type: 'number', unit: 'g/L', hint: 'Min 110 g/L' },
      { key: 'alcohol', label: 'Titolo alcolometrico', type: 'number', unit: '% vol', hint: 'Max 1.5% vol' },
      { key: 'dryExtract', label: 'Estratto secco netto', type: 'number', unit: 'g/L', hint: 'Min 30 g/L' },
      { key: 'so2', label: 'SO₂ totale', type: 'number', unit: 'mg/L', hint: 'Max 100 mg/L' },
      { key: 'ash', label: 'Ceneri', type: 'number', unit: '‰', hint: 'Min 2.5‰' },
      { key: 'agingMonths', label: 'Invecchiamento', type: 'number', unit: 'mesi', hint: 'Min 2 mesi (60 gg)' },
      { key: 'barrelId', label: 'ID barile / vasca', type: 'text' },
      { key: 'temperature', label: 'Temperatura', type: 'number', unit: '°C' },
    ],
    rules: [
      { field: 'acidity', label: 'Acidità totale', min: 6, unit: '%' },
      { field: 'density', label: 'Densità', min: 1.06, unit: 'g/ml' },
      { field: 'sugars', label: 'Zuccheri riduttori', min: 110, unit: 'g/L' },
      { field: 'agingMonths', label: 'Invecchiamento', min: 2, unit: 'mesi' },
      { field: 'alcohol', label: 'Titolo alcolometrico', max: 1.5, unit: '% vol' },
      { field: 'dryExtract', label: 'Estratto secco netto', min: 30, unit: 'g/L' },
      { field: 'so2', label: 'SO₂ totale', max: 100, unit: 'mg/L' },
      { field: 'ash', label: 'Ceneri', min: 2.5, unit: '‰' },
    ],
  },

  // ── FORMAGGI ─────────────────────────────────────────────────────────────────
  'gorgonzola': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['dolce', 'piccante'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 48, unit: '%' },
      { field: 'aging_days', label: 'Giorni maturazione (dolce min 50, piccante min 80)', min: 50, unit: 'giorni' },
      { field: 'wheel_weight_kg', label: 'Peso forma', min: 6, max: 13, unit: 'kg' },
    ],
  },

  'asiago': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['fresco', 'mezzano', 'vecchio', 'stravecchio'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 44, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura (fresco min 20)', min: 20, unit: 'giorni' },
      { field: 'wheel_weight_kg', label: 'Peso forma', min: 8, max: 12, unit: 'kg' },
    ],
  },

  'fontina': {
    fields: [
      { key: 'milk_liters', label: 'Latte intero crudo utilizzato', type: 'number', unit: 'L', required: true },
      { key: 'milk_fat_percent', label: 'Tenore grasso latte', type: 'number', unit: '%' },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 45%' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 90 giorni' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg', hint: '7.5–12 kg' },
      { key: 'cellar_humidity_percent', label: 'Umidità cantina', type: 'number', unit: '%' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 45, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura', min: 90, unit: 'giorni' },
      { field: 'wheel_weight_kg', label: 'Peso forma', min: 7.5, max: 12, unit: 'kg' },
    ],
  },

  'grana-padano': {
    fields: [
      { key: 'milk_liters', label: 'Latte parzialmente scremato', type: 'number', unit: 'L', required: true },
      { key: 'skimming_hours', label: 'Ore di affioramento', type: 'number', unit: 'h', hint: 'Affioration naturale' },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 44%' },
      { key: 'aging_months', label: 'Mesi di stagionatura', type: 'number', unit: 'mesi', hint: 'Min 9 mesi (Riserva min 20)' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg', hint: '24–40 kg' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 44, unit: '%' },
      { field: 'aging_months', label: 'Mesi stagionatura', min: 9, unit: 'mesi' },
      { field: 'wheel_weight_kg', label: 'Peso forma', min: 24, max: 40, unit: 'kg' },
    ],
  },

  'bitto': {
    fields: [
      { key: 'cow_milk_liters', label: 'Latte vaccino', type: 'number', unit: 'L', required: true },
      { key: 'goat_milk_liters', label: 'Latte caprino', type: 'number', unit: 'L', hint: 'Max 10–20% sul totale' },
      { key: 'goat_milk_percent', label: '% latte caprino', type: 'number', unit: '%', hint: 'Max 20%' },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 70 giorni' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg', hint: '8–25 kg' },
    ],
    rules: [
      { field: 'goat_milk_percent', label: '% latte caprino', max: 20, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura', min: 70, unit: 'giorni' },
    ],
  },

  'casatella-trevigiana': {
    fields: [
      { key: 'milk_liters', label: 'Latte vaccino intero pastorizzato', type: 'number', unit: 'L', required: true },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 48%' },
      { key: 'form_weight_g', label: 'Peso forma', type: 'number', unit: 'g', hint: '300–2200 g' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 48, unit: '%' },
      { field: 'form_weight_g', label: 'Peso forma', min: 300, max: 2200, unit: 'g' },
    ],
  },

  'montasio': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['fresco', 'mezzano', 'stagionato', 'stravecchio'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 40, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura (fresco min 60)', min: 60, unit: 'giorni' },
    ],
  },

  'monte-veronese': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['latte', 'd_allevo'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s. (latte min 44%, d\'allevo min 27%)', min: 27, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura (latte min 30, d\'allevo min 180)', min: 30, unit: 'giorni' },
    ],
  },

  'nostrano-valtrompia': {
    fields: [
      { key: 'cow_milk_liters', label: 'Latte vaccino', type: 'number', unit: 'L', required: true },
      { key: 'goat_milk_liters', label: 'Latte caprino', type: 'number', unit: 'L', hint: 'Max 30% sul totale' },
      { key: 'goat_milk_percent', label: '% latte caprino', type: 'number', unit: '%', hint: 'Max 30%' },
      { key: 'saffron_added', label: 'Zafferano aggiunto', type: 'select', options: ['sì', 'no'] },
      { key: 'aging_months', label: 'Mesi di stagionatura', type: 'number', unit: 'mesi', hint: 'Min 12 mesi' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg', hint: '8–18 kg' },
    ],
    rules: [
      { field: 'goat_milk_percent', label: '% latte caprino', max: 30, unit: '%' },
      { field: 'aging_months', label: 'Mesi stagionatura', min: 12, unit: 'mesi' },
    ],
  },

  'piave': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['freschissimo', 'fresco', 'mezzano', 'vecchio', 'vecchio_selezione_oro'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'aging_days', label: 'Giorni stagionatura (freschissimo min 0, fresco min 20)', min: 0, unit: 'giorni' },
    ],
  },

  'provolone-valpadana': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['dolce', 'piccante', 'affumicato'], required: true },
      { key: 'milk_liters', label: 'Latte vaccino', type: 'number', unit: 'L', required: true },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 44%' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Dolce max 90, piccante oltre 90' },
      { key: 'weight_kg', label: 'Peso pezzo', type: 'number', unit: 'kg' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 44, unit: '%' },
    ],
  },

  'spressa-delle-giudicarie': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['giovane', 'stagionato'], required: true },
      ...CHEESE_COMMON,
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 35, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura (giovane min 90, stagionato min 180)', min: 90, unit: 'giorni' },
    ],
  },

  'valle-daosta-fromadzo': {
    fields: [
      { key: 'milk_liters', label: 'Latte vaccino', type: 'number', unit: 'L', required: true },
      { key: 'goat_milk_percent', label: '% latte caprino', type: 'number', unit: '%', hint: 'Max 10%' },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Demi-gras min 20%, gras min 35%' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 60 giorni' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg' },
      { key: 'variety', label: 'Tipo di grasso', type: 'select', options: ['demi-gras', 'gras'] },
    ],
    rules: [
      { field: 'goat_milk_percent', label: '% latte caprino', max: 10, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura', min: 60, unit: 'giorni' },
    ],
  },

  'valtellina-casera': {
    fields: [
      { key: 'milk_liters', label: 'Latte vaccino parzialmente scremato', type: 'number', unit: 'L', required: true },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 34%' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 70 giorni' },
      { key: 'wheel_weight_kg', label: 'Peso forma', type: 'number', unit: 'kg', hint: '7–12 kg' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 34, unit: '%' },
      { field: 'aging_days', label: 'Giorni stagionatura', min: 70, unit: 'giorni' },
    ],
  },

  'ricotta-di-bufala-campana': {
    fields: [
      { key: 'whey_liters', label: 'Siero di bufala', type: 'number', unit: 'L', required: true },
      { key: 'fat_on_dry_matter_percent', label: 'Grasso sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 16%' },
      { key: 'protein_on_dry_matter_percent', label: 'Proteine sulla sostanza secca', type: 'number', unit: '%', hint: 'Min 12%' },
      { key: 'weight_kg', label: 'Peso confezione', type: 'number', unit: 'kg' },
    ],
    rules: [
      { field: 'fat_on_dry_matter_percent', label: 'Grasso s.s.', min: 16, unit: '%' },
      { field: 'protein_on_dry_matter_percent', label: 'Proteine s.s.', min: 12, unit: '%' },
    ],
  },

  // ── SALUMI ────────────────────────────────────────────────────────────────────
  'bresaola-della-valtellina': {
    fields: [
      { key: 'cut_type', label: 'Taglio', type: 'select', options: ['punta_d_anca', 'fesa', 'sottofesa', 'magatello', 'noce'], required: true },
      { key: 'raw_weight_kg', label: 'Peso carne cruda', type: 'number', unit: 'kg', required: true },
      { key: 'finished_weight_kg', label: 'Peso prodotto finito', type: 'number', unit: 'kg', hint: '1.3–2.5 kg' },
      { key: 'salt_percent', label: 'Contenuto di sale', type: 'number', unit: '%', hint: 'Max 5%' },
      { key: 'curing_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 28 giorni' },
    ],
    rules: [
      { field: 'finished_weight_kg', label: 'Peso finito', min: 1.3, max: 2.5, unit: 'kg' },
      { field: 'salt_percent', label: 'Contenuto di sale', max: 5, unit: '%' },
      { field: 'curing_days', label: 'Giorni stagionatura', min: 28, unit: 'giorni' },
    ],
  },

  'sopressa-vicentina': {
    fields: [
      { key: 'pork_weight_kg', label: 'Carne suina', type: 'number', unit: 'kg', required: true },
      { key: 'fat_percent', label: 'Contenuto di grasso', type: 'number', unit: '%', hint: 'Tipicamente 20–30%' },
      { key: 'diameter_cm', label: 'Diametro insaccato', type: 'number', unit: 'cm' },
      { key: 'aging_days', label: 'Giorni di stagionatura', type: 'number', unit: 'giorni', hint: 'Min 60 giorni (grandi min 120)' },
      { key: 'weight_kg', label: 'Peso pezzo', type: 'number', unit: 'kg', hint: '3–15 kg' },
    ],
    rules: [
      { field: 'aging_days', label: 'Giorni stagionatura', min: 60, unit: 'giorni' },
      { field: 'weight_kg', label: 'Peso pezzo', min: 3, max: 15, unit: 'kg' },
    ],
  },

  // ── VINO ──────────────────────────────────────────────────────────────────────
  'chianti-classico': {
    fields: [
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['annata', 'riserva', 'gran_selezione'], required: true },
      { key: 'sangiovese_percent', label: 'Percentuale Sangiovese', type: 'number', unit: '%', hint: 'Min 80%', required: true },
      { key: 'total_alcohol_percent', label: 'Titolo alcolometrico totale', type: 'number', unit: '% vol', hint: 'Annata/Riserva min 12%, Gran Selezione min 13%' },
      { key: 'actual_alcohol_percent', label: 'Titolo alcolometrico effettivo', type: 'number', unit: '% vol' },
      { key: 'residual_sugar_g_l', label: 'Zuccheri residui', type: 'number', unit: 'g/L', hint: 'Vino secco: max 4 g/L' },
      { key: 'total_acidity_g_l', label: 'Acidità totale', type: 'number', unit: 'g/L', hint: 'Min 4.5 g/L' },
      { key: 'aging_months', label: 'Mesi di affinamento', type: 'number', unit: 'mesi', hint: 'Riserva min 24, Gran Selezione min 30' },
      { key: 'total_liters', label: 'Totale litri prodotti', type: 'number', unit: 'L', required: true },
    ],
    rules: [
      { field: 'sangiovese_percent', label: 'Sangiovese', min: 80, unit: '%' },
      { field: 'total_alcohol_percent', label: 'Titolo alcolometrico totale', min: 12, unit: '% vol' },
      { field: 'total_acidity_g_l', label: 'Acidità totale', min: 4.5, unit: 'g/L' },
    ],
  },

  'garda': {
    fields: [
      { key: 'wine_type', label: 'Tipologia', type: 'select', options: ['bianco', 'rosso', 'rosato', 'spumante', 'frizzante'], required: true },
      { key: 'grape_variety', label: 'Varietà principale', type: 'text', required: true },
      { key: 'total_alcohol_percent', label: 'Titolo alcolometrico totale', type: 'number', unit: '% vol', hint: 'Min 10.5% vol' },
      { key: 'actual_alcohol_percent', label: 'Titolo alcolometrico effettivo', type: 'number', unit: '% vol' },
      { key: 'residual_sugar_g_l', label: 'Zuccheri residui', type: 'number', unit: 'g/L' },
      { key: 'total_acidity_g_l', label: 'Acidità totale', type: 'number', unit: 'g/L', hint: 'Min 4.5 g/L' },
      { key: 'aging_months', label: 'Mesi di affinamento', type: 'number', unit: 'mesi' },
      { key: 'total_liters', label: 'Totale litri prodotti', type: 'number', unit: 'L', required: true },
    ],
    rules: [
      { field: 'total_alcohol_percent', label: 'Titolo alcolometrico totale', min: 10.5, unit: '% vol' },
      { field: 'total_acidity_g_l', label: 'Acidità totale', min: 4.5, unit: 'g/L' },
    ],
  },

  // ── MIELE ─────────────────────────────────────────────────────────────────────
  'miele-delle-dolomiti-bellunesi': {
    fields: [
      { key: 'honey_type', label: 'Tipo di miele', type: 'select', options: ['millefiori', 'acacia', 'castagno', 'tiglio', 'rododendro'], required: true },
      { key: 'harvest_date', label: 'Data raccolta', type: 'date', required: true },
      { key: 'total_weight_kg', label: 'Peso produzione', type: 'number', unit: 'kg', required: true },
      { key: 'moisture_percent', label: 'Contenuto di acqua', type: 'number', unit: '%', hint: 'Max 18%' },
      { key: 'hmf_mg_kg', label: 'HMF', type: 'number', unit: 'mg/kg', hint: 'Max 15 mg/kg' },
      { key: 'diastase_index', label: 'Indice diastatico (Göthe)', type: 'number', hint: 'Min 8' },
      { key: 'fructose_glucose_percent', label: 'Fruttosio + Glucosio', type: 'number', unit: '%', hint: 'Min 60%' },
    ],
    rules: [
      { field: 'moisture_percent', label: 'Contenuto di acqua', max: 18, unit: '%' },
      { field: 'hmf_mg_kg', label: 'HMF', max: 15, unit: 'mg/kg' },
      { field: 'diastase_index', label: 'Indice diastatico', min: 8 },
      { field: 'fructose_glucose_percent', label: 'Fruttosio + Glucosio', min: 60, unit: '%' },
    ],
  },

  // ── PESCE ─────────────────────────────────────────────────────────────────────
  'salmerino-del-trentino': {
    fields: [
      { key: 'slaughter_date', label: 'Data macellazione', type: 'date', required: true },
      { key: 'batch_count', label: 'Numero capi', type: 'number', required: true },
      { key: 'avg_weight_g', label: 'Peso medio macellazione', type: 'number', unit: 'g', hint: '150–700 g', required: true },
      { key: 'total_weight_kg', label: 'Peso totale', type: 'number', unit: 'kg' },
      { key: 'water_source', label: 'Sorgente d\'acqua', type: 'text', hint: 'Sorgente montana certificata' },
      { key: 'feed_type', label: 'Tipo di mangime', type: 'select', options: ['certificato_dop', 'biologico'] },
    ],
    rules: [
      { field: 'avg_weight_g', label: 'Peso medio macellazione', min: 150, max: 700, unit: 'g' },
    ],
  },

  // ── ORTAGGI & FRUTTA ──────────────────────────────────────────────────────────
  'aglio-bianco-polesano': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'avg_bulb_diameter_mm', label: 'Diametro medio bulbo', type: 'number', unit: 'mm', hint: 'Min 45 mm', required: true },
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['medio', 'grande', 'extra_grande'] },
    ],
    rules: [
      { field: 'avg_bulb_diameter_mm', label: 'Diametro bulbo', min: 45, unit: 'mm' },
    ],
  },

  'amarene-brusche-di-modena': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['amarena_di_vignola', 'ravenna', 'altre'] },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number' },
      { key: 'total_acidity_meq', label: 'Acidità totale', type: 'number', unit: 'meq/100g', hint: 'Min 10 meq/100g' },
    ],
    rules: [
      { field: 'total_acidity_meq', label: 'Acidità totale', min: 10, unit: 'meq/100g' },
    ],
  },

  'asparago-bianco-di-bassano': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['extra', 'prima', 'seconda'], required: true },
      { key: 'avg_diameter_mm', label: 'Diametro medio', type: 'number', unit: 'mm', hint: 'Min 12 mm' },
    ],
    rules: [
      { field: 'avg_diameter_mm', label: 'Diametro', min: 12, unit: 'mm' },
    ],
  },

  'asparago-bianco-di-cimadolmo': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['extra', 'prima', 'seconda'], required: true },
      { key: 'avg_diameter_mm', label: 'Diametro medio', type: 'number', unit: 'mm', hint: 'Min 10 mm' },
    ],
    rules: [
      { field: 'avg_diameter_mm', label: 'Diametro', min: 10, unit: 'mm' },
    ],
  },

  'asparago-di-badoere': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'asparagus_type', label: 'Tipo asparago', type: 'select', options: ['bianco', 'violetto', 'verde'], required: true },
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['extra', 'prima', 'seconda'] },
      { key: 'avg_diameter_mm', label: 'Diametro medio', type: 'number', unit: 'mm' },
    ],
    rules: [],
  },

  'ciliegia-di-marostica': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['bigarreau_moreau', 'durone', 'linda', 'ferrovia', 'lapins'], required: true },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 12' },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 22 mm' },
    ],
    rules: [
      { field: 'brix_degrees', label: 'Gradi Brix', min: 12 },
      { field: 'caliber_mm', label: 'Calibro', min: 22, unit: 'mm' },
    ],
  },

  'cipollotto-nocerino': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'avg_bulb_diameter_mm', label: 'Diametro bulbo', type: 'number', unit: 'mm', hint: '10–25 mm' },
    ],
    rules: [
      { field: 'avg_bulb_diameter_mm', label: 'Diametro bulbo', min: 10, max: 25, unit: 'mm' },
    ],
  },

  'fagiolo-di-lamon-della-vallata-bellunese': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['spagnolit', 'calonega', 'canalino', 'spagnol'], required: true },
      { key: 'type', label: 'Tipo', type: 'select', options: ['fresco', 'secco'], required: true },
      { key: 'moisture_percent', label: 'Umidità (secco)', type: 'number', unit: '%', hint: 'Max 16% se secco' },
    ],
    rules: [
      { field: 'moisture_percent', label: 'Umidità', max: 16, unit: '%' },
    ],
  },

  'insalata-di-lusia': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['lattuga_romana', 'lattuga_cappuccina', 'iceberg'], required: true },
      { key: 'avg_head_weight_g', label: 'Peso medio cespo', type: 'number', unit: 'g' },
    ],
    rules: [],
  },

  'marrone-di-combai': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'fruits_per_kg', label: 'Frutti per kg', type: 'number', hint: 'Max 75 frutti/kg', required: true },
      { key: 'moisture_percent', label: 'Umidità', type: 'number', unit: '%', hint: 'Max 14%' },
    ],
    rules: [
      { field: 'fruits_per_kg', label: 'Frutti per kg', max: 75 },
      { field: 'moisture_percent', label: 'Umidità', max: 14, unit: '%' },
    ],
  },

  'marrone-di-san-zeno': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'fruits_per_kg', label: 'Frutti per kg', type: 'number', hint: 'Max 75 frutti/kg', required: true },
      { key: 'moisture_percent', label: 'Umidità', type: 'number', unit: '%', hint: 'Max 14%' },
    ],
    rules: [
      { field: 'fruits_per_kg', label: 'Frutti per kg', max: 75 },
      { field: 'moisture_percent', label: 'Umidità', max: 14, unit: '%' },
    ],
  },

  'marroni-del-monfenera': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'fruits_per_kg', label: 'Frutti per kg', type: 'number', hint: 'Max 75 frutti/kg', required: true },
      { key: 'moisture_percent', label: 'Umidità', type: 'number', unit: '%', hint: 'Max 14%' },
    ],
    rules: [
      { field: 'fruits_per_kg', label: 'Frutti per kg', max: 75 },
      { field: 'moisture_percent', label: 'Umidità', max: 14, unit: '%' },
    ],
  },

  'mela-di-valtellina': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['golden_delicious', 'gala', 'braeburn', 'jonagold', 'fuji', 'morgenduft'], required: true },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 60 mm' },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 10' },
    ],
    rules: [
      { field: 'caliber_mm', label: 'Calibro', min: 60, unit: 'mm' },
      { field: 'brix_degrees', label: 'Gradi Brix', min: 10 },
    ],
  },

  'mela-val-di-non': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['red_delicious', 'golden_delicious', 'renetta_canada'], required: true },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 11.5' },
      { key: 'flesh_firmness_kg_cm2', label: 'Durezza polpa', type: 'number', unit: 'kg/cm²' },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 65 mm' },
    ],
    rules: [
      { field: 'brix_degrees', label: 'Gradi Brix', min: 11.5 },
      { field: 'caliber_mm', label: 'Calibro', min: 65, unit: 'mm' },
    ],
  },

  'melanzana-rossa-di-rotonda': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'avg_fruit_weight_g', label: 'Peso medio frutto', type: 'number', unit: 'g', hint: '80–180 g', required: true },
    ],
    rules: [
      { field: 'avg_fruit_weight_g', label: 'Peso medio frutto', min: 80, max: 180, unit: 'g' },
    ],
  },

  'pera-mantovana': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['abate_fetel', 'kaiser', 'conference', 'william', 'decana'], required: true },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 55 mm' },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number' },
    ],
    rules: [
      { field: 'caliber_mm', label: 'Calibro', min: 55, unit: 'mm' },
    ],
  },

  'pesca-di-verona': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Tipo', type: 'select', options: ['pesca', 'nettarina', 'percoca'], required: true },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 9 (pesca), min 9.5 (nettarina)' },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 56 mm' },
    ],
    rules: [
      { field: 'brix_degrees', label: 'Gradi Brix', min: 9 },
      { field: 'caliber_mm', label: 'Calibro', min: 56, unit: 'mm' },
    ],
  },

  'radicchio-di-chioggia': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['piccolo', 'medio', 'grande'] },
      { key: 'avg_head_weight_g', label: 'Peso medio cespo', type: 'number', unit: 'g', hint: 'Min 100 g' },
    ],
    rules: [
      { field: 'avg_head_weight_g', label: 'Peso medio cespo', min: 100, unit: 'g' },
    ],
  },

  'radicchio-di-verona': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['prima', 'seconda'] },
      { key: 'avg_head_weight_g', label: 'Peso medio cespo', type: 'number', unit: 'g' },
    ],
    rules: [],
  },

  'radicchio-rosso-di-treviso': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Tipologia', type: 'select', options: ['precoce', 'tardivo'], required: true },
      { key: 'avg_head_weight_g', label: 'Peso medio cespo', type: 'number', unit: 'g' },
    ],
    rules: [],
  },

  'radicchio-variegato-di-castelfranco': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'caliber_class', label: 'Classe calibro', type: 'select', options: ['prima', 'seconda'] },
      { key: 'avg_head_weight_g', label: 'Peso medio cespo', type: 'number', unit: 'g' },
    ],
    rules: [],
  },

  'susina-di-dro': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 12' },
      { key: 'caliber_mm', label: 'Calibro', type: 'number', unit: 'mm', hint: 'Min 22 mm' },
      { key: 'dry_matter_percent', label: 'Sostanza secca', type: 'number', unit: '%', hint: 'Min 16%' },
    ],
    rules: [
      { field: 'brix_degrees', label: 'Gradi Brix', min: 12 },
      { field: 'caliber_mm', label: 'Calibro', min: 22, unit: 'mm' },
    ],
  },

  'uva-da-tavola-di-canicatti': {
    fields: [
      ...FRUIT_COMMON,
      { key: 'variety', label: 'Varietà', type: 'select', options: ['italia', 'vittoria'], required: true },
      { key: 'brix_degrees', label: 'Gradi Brix', type: 'number', hint: 'Min 14' },
      { key: 'avg_bunch_weight_g', label: 'Peso medio grappolo', type: 'number', unit: 'g', hint: 'Min 150 g' },
    ],
    rules: [
      { field: 'brix_degrees', label: 'Gradi Brix', min: 14 },
      { field: 'avg_bunch_weight_g', label: 'Peso medio grappolo', min: 150, unit: 'g' },
    ],
  },
}

export function getDenominationConfig(denominationId: string): DenominationConfig {
  return DENOMINATION_CONFIGS[denominationId] ?? { fields: [], rules: [] }
}

export function validateDenominationFields(
  denominationId: string,
  fields: Record<string, string | number>,
): string[] {
  const config = getDenominationConfig(denominationId)
  const warnings: string[] = []
  for (const rule of config.rules) {
    const raw = fields[rule.field]
    const value = typeof raw === 'string' ? parseFloat(raw) : raw
    if (!value || value <= 0) continue
    if (rule.min !== undefined && value < rule.min) {
      warnings.push(`${rule.label} sotto il minimo (${rule.min}${rule.unit ? ' ' + rule.unit : ''})`)
    }
    if (rule.max !== undefined && value > rule.max) {
      warnings.push(`${rule.label} sopra il massimo (${rule.max}${rule.unit ? ' ' + rule.unit : ''})`)
    }
  }
  return warnings
}
