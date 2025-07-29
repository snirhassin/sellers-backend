# UI Mockups - Sellers Backend

## Screen 1: Seller Product Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 Seller Dashboard - ABC Electronics                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Products | Analytics                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Upload New Products ──────────┐  ┌─ Quick Stats ─────────────────────┐  │
│ │ 📁 Choose CSV/Excel File       │  │ Total Products: 1,247             │  │
│ │ [Select File] [Upload]         │  │ Last Upload: Jan 15, 2024         │  │
│ └────────────────────────────────┘  │ Active Products: 1,180             │  │
│                                     │ Commission This Month: $12,450     │  │
│ ┌─ Search & Filters ─────────────┐  └────────────────────────────────────┘  │
│ │ Search: [____________] 🔍       │                                         │
│ │ Market: [All ▼] ASIN: [_____]  │                                         │
│ │ Commission: [All ▼]            │                                         │
│ └────────────────────────────────┘                                         │
│                                                                             │
│ ┌─ Product List ─────────────────────────────────────────────────────────┐  │
│ │ ☑ ASIN        │ Product Name      │ Market │ Price  │ Comm. │ Actions  │  │
│ │ ├─────────────┼───────────────────┼────────┼────────┼───────┼──────────┤  │
│ │ ☑ B08N5WRWNW  │ Wireless Earbuds  │ US     │ $29.99 │ 8.5%  │ Edit Del │  │
│ │ ☑ B07XJ8C8F7  │ Phone Charger     │ UK     │ £15.99 │ 7.0%  │ Edit Del │  │
│ │ ☑ B09KXJM2P3  │ Bluetooth Speaker │ DE     │ €45.50 │ 9.2%  │ Edit Del │  │
│ │ ☑ B08HLQD2J6  │ USB Cable         │ US     │ $12.99 │ 6.5%  │ Edit Del │  │
│ │ └─────────────┴───────────────────┴────────┴────────┴───────┴──────────┘  │
│ │                                                                         │  │
│ │ [< Previous] Page 1 of 25 [Next >]           [Export Selected] [Bulk]  │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─ Recent Upload History ─────────────────────────────────────────────────┐  │
│ │ Jan 15: products_jan_2024.csv (245 products) ✅ Success                │  │
│ │ Dec 20: holiday_products.xlsx (89 products) ✅ Success                 │  │
│ │ Dec 15: products_dec_2023.csv (312 products) ⚠️  12 errors             │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Screen 2: Seller Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 Seller Dashboard - ABC Electronics                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Products | Analytics                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Time Period ──────┐  ┌─ Export Reports ──────────────────────────────┐  │
│ │ [Last 30 Days ▼]   │  │ 📊 Monthly Report    [Download PDF]           │  │
│ │ Custom: [___] to   │  │ 💰 Commission Report [Download Excel]         │  │
│ │         [___]      │  │ 📈 Performance Data  [Download CSV]           │  │
│ └────────────────────┘  └────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─ Revenue Overview ─────────────────────────────────────────────────────┐  │
│ │ Total Revenue: $45,230    Units Sold: 2,847    Avg. Order: $15.89     │  │
│ │                                                                         │  │
│ │    Revenue Trend (Last 6 Months)                                       │  │
│ │ 50k ┌─────────────────────────────────────────────┐                    │  │
│ │     │          ╭─╮                                 │                    │  │
│ │ 40k │        ╭─╯ ╰╮                               │                    │  │
│ │     │      ╭─╯    ╰─╮                             │                    │  │
│ │ 30k │    ╭─╯        ╰─╮                           │                    │  │
│ │     │  ╭─╯            ╰──╮                        │                    │  │
│ │ 20k │╭─╯                 ╰─╮                      │                    │  │
│ │     └─────────────────────────────────────────────┘                    │  │
│ │     Aug  Sep  Oct  Nov  Dec  Jan                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─ Top Performing Products ──────────────┐ ┌─ Commission Breakdown ──────┐  │
│ │ Product Name         │ Units │ Revenue │ │ This Month: $3,247          │  │
│ │ ├────────────────────┼───────┼─────────┤ │ Last Month: $2,890          │  │
│ │ Wireless Earbuds     │  234  │ $7,017  │ │ Growth: +12.4% ↗           │  │
│ │ Bluetooth Speaker    │  156  │ $7,098  │ │                             │  │
│ │ Phone Charger        │  189  │ $3,021  │ │ Commission Rate Distribution │  │
│ │ USB Cable           │  298  │ $3,867  │ │ 6-7%:  ████████ 34%        │  │
│ │ Power Bank          │  134  │ $4,020  │ │ 7-8%:  ██████ 28%          │  │
│ └────────────────────────────────────────┘ │ 8-9%:  ████ 19%            │  │
│                                             │ 9%+:   ███ 19%             │  │
│ ┌─ Market Performance ───────────────────┐ └─────────────────────────────┘  │
│ │ Market │ Products │ Revenue │ Avg Com │                                 │  │
│ │ ├──────┼──────────┼─────────┼─────────┤                                 │  │
│ │ US     │   589    │ $18,234 │  7.8%   │                                 │  │
│ │ UK     │   398    │ $12,890 │  7.2%   │                                 │  │
│ │ DE     │   234    │  $9,456 │  8.1%   │                                 │  │
│ │ CA     │   156    │  $4,650 │  7.5%   │                                 │  │
│ └────────────────────────────────────────┘                                 │  │
│                                                                             │
│ ┌─ Recent Activity ───────────────────────────────────────────────────────┐  │
│ │ • 15 new sales recorded for Wireless Earbuds (2 hours ago)             │  │
│ │ • Commission rate updated for Phone Charger (1 day ago)                │  │
│ │ • 89 products uploaded in holiday_products.xlsx (3 days ago)           │  │
│ │ • Monthly report generated and sent (5 days ago)                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Additional UI Components

### Upload Modal
```
┌─ Upload Product List ─────────────────────────┐
│                                               │
│ Step 1: Select File                           │
│ ┌─────────────────────────────────────────┐   │
│ │ Drag & drop CSV/Excel file here        │   │
│ │            or                           │   │
│ │        [Choose File]                    │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ Step 2: Map Columns                           │
│ CSV Column    →    Database Field             │
│ Product_Name  →    [Product Name ▼]           │
│ ASIN_Code     →    [ASIN ▼]                   │
│ Market_Place  →    [Market ▼]                 │
│ Price_USD     →    [Price ▼]                  │
│ Commission    →    [Commission Rate ▼]        │
│                                               │
│ ☑ Skip first row (headers)                    │
│ ☑ Update existing products                    │
│                                               │
│ [Cancel]                     [Upload Products] │
└───────────────────────────────────────────────┘
```

### Error Handling Display
```
┌─ Upload Results ──────────────────────────────┐
│                                               │
│ ✅ Upload Completed                           │
│                                               │
│ 📊 Summary:                                   │
│ • Total rows: 245                             │
│ • Successfully imported: 233                  │
│ • Failed: 12                                  │
│                                               │
│ ⚠️  Errors Found:                             │
│ • Row 15: Invalid ASIN format                 │
│ • Row 23: Missing product name                │
│ • Row 87: Commission rate out of range        │
│ • Row 156: Duplicate ASIN                     │
│                                               │
│ [Download Error Report] [Close]               │
└───────────────────────────────────────────────┘
```