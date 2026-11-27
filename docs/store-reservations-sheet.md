# Store reservations → Google Sheet

Sheet: [it club cest + id](https://docs.google.com/spreadsheets/d/1b1A9lm_N74x3fxBuRe6Ixi6tc2vnj75ghnCA7CJgy_w/edit)

The site never holds Google credentials. `POST /api/store/reserve` validates the reservation,
creates a code like `ITC-7K2QD`, and posts one row to an Apps Script web app bound to the sheet.
The member is then sent to WhatsApp with a prefilled message carrying the same code, where they
attach their personal photo and payment screenshot.

## Setup (≈2 minutes)

1. Open the sheet → **Extensions → Apps Script**.
2. Replace the editor content with the script below. Change `SECRET` to a long random string.
3. **Deploy → New deployment → Web app** — *Execute as:* **Me**, *Who has access:* **Anyone**. Authorise.
4. Copy the Web app URL (`https://script.google.com/macros/s/…/exec`).
5. Set the site environment variables:
   - `STORE_SHEET_WEBHOOK_URL` = the Web app URL
   - `STORE_SHEET_SECRET` = the same `SECRET`
   - `STORE_WHATSAPP_NUMBER` = the receiving WhatsApp number, e.g. `2010XXXXXXXX`

The first reservation writes the header row automatically.

```javascript
const SECRET = "change-me-long-random-string";
const SHEET_NAME = "Reservations";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return json({ ok: false, error: "unauthorized" });
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(data.columns);
      sheet.getRange(1, 1, 1, data.columns.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(data.row.map((cell) => String(cell).slice(0, 200)));
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
```

Columns: Submitted at · Code · Kit · Eligibility · Price (EGP) · Name · Academic ID · Position ·
Committee · Vest size · Photo · Payment screenshot · Status. Update *Photo / Payment screenshot /
Status* by hand once the WhatsApp message arrives.
