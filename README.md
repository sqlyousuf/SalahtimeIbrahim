# Salah Times Studio

A small web app for Masjid Ibrahim & Klein Islamic Center. You edit the prayer timings and it makes the flyer image to send out.

## How to use
1. Change the dates, the Islamic month (or click **Auto-detect**) and the timings.
2. Look at the live preview on the right.
3. Click **Download Image** to save a PNG (1800 × 2400). On a phone, use **Share** to send it straight to WhatsApp.

Your changes are saved in the browser on that device. Time boxes you changed since the last download get a gold outline.
You can upload the real logos under **Addresses, Contact & Logos**.

## Deploy on Vercel
It's a static site, so there is no build step.
1. Push this folder to a GitHub repo.
2. In Vercel, go to **Add New → Project**, import the repo, and set Framework Preset to **Other**. Leave the build command empty.
3. Click **Deploy**.

Or from this folder run: `npx vercel --prod`
