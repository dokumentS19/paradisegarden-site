# АН «Райський Сад» — лендінг

Готовий адаптивний сайт. Вставте ваші зображення у `assets/`:
- `assets/logo-rayskyi-sad.png` — логотип агентства
- `assets/director.jpg` — фото директора

## Запуск локально
Будь-який статичний сервер (наприклад, у VS Code — Live Server). Відкриття напряму через `file://` може блокувати `fetch()` CSV.

## Налаштування контактів
У `script.js` відредагуйте константи `PHONE_NUMBER`, `VIBER_NUMBER`, `TELEGRAM_LINK` за потреби (вже заповнено номером +380674464705).

## Дані оголошень
За замовчуванням дані беруться з `assets/data/featured.csv`.

### Підключення Google Sheets CSV
1) Файл → Опублікувати в Інтернеті → Аркуш → CSV → Опублікувати.
2) Сформуйте URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=SHEET_GID`
3) Вставте його в `script.js` у `REMOTE_SHEET_CSV_URL`.

### Підключення Airtable View CSV
1) Share view → Create a shareable grid view link → Download CSV (Copy link address)
2) Вставте посилання в `script.js` у `AIRTABLE_VIEW_CSV_URL`.

Очікувані заголовки CSV:
`id,title,type,city,location,price_value,price_currency,area,bedrooms,bathrooms,cover,gallery,url,badges,date`

