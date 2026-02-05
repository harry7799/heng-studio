<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your portfolio app

This repository contains a Vite + React portfolio website. It does not require any AI keys by default.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Static Content (recommended)

If you "almost never change" your site content, the simplest + safest approach is to use a local folder + a single `content.json` file.

- Content file: `public/content.json`
- Images folder: `public/images/`

### How to replace images

1. Put files into `public/images/` (see `public/images/README.txt` for naming suggestions)
2. Update paths in `public/content.json` (use `/images/...` paths)

### How to see image-to-section mapping

Open the site with `?labels=1` to show debug labels on key sections.
Example: `http://localhost:3000/?labels=1#/`

## Works (作品集) 照片子資料夾（推薦）

你可以為每一個作品建立自己的照片資料夾，網站會在 build 時自動產生清單，並在作品詳情頁使用。

- 資料夾規則：`public/images/projects/{projectId}/`
- 檔名建議：`cover.jpg`（選用，當作封面）+ `001.jpg`, `002.jpg`, ...
- 例子：
   - `public/images/projects/1/cover.jpg`
   - `public/images/projects/1/001.jpg`
   - `public/images/projects/1/002.jpg`

Build 時會自動生成：`public/projects.json`

## Admin / Security

This project includes a lightweight admin token to protect write operations (create/update/delete projects and upload images).

- Set an admin token (PowerShell):
   - `$env:ADMIN_TOKEN = "your-strong-random-token"; npm run dev`
- Open the admin page at `#/admin` and paste the same token.

### What it protects

- `POST/PUT/PATCH/DELETE /api/projects` require `X-Admin-Token`.
- `GET /api/media` and `POST /api/uploads` require `X-Admin-Token`.

### Backups

Every time projects are written, the API stores a best-effort backup at `server/data/backups/` (keeps the latest 20).
If something is deleted accidentally, you can restore by copying a backup over `server/data/projects.json`.

## CMS / 圖片管理（上傳或資料夾）

- 後台在 `http://localhost:3000/#/admin`
- 你可以在後台直接上傳圖片，系統會存到 `server/uploads/`，並回填 `imageUrl` 為 `/uploads/<檔名>`
- 你也可以手動把圖片放進 `server/uploads/`，回到後台按 `Refresh` 就會出現在選圖區
