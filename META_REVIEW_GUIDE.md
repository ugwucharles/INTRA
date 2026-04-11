# 🛡️ Meta App Review Guide: INTRA

This guide contains the exact information and strategy you need to pass the Meta (Facebook) App Review for **INTRA**.

---

## 🔗 1. Required Legal URLs
Copy and paste these into your Meta App Settings (Basic):
- **Privacy Policy URL**: `https://intrabox.com.ng/privacy`
- **Terms of Service URL**: `https://intrabox.com.ng/terms`
- **User Data Deletion URL**: `https://intrabox.com.ng/data-deletion`

---

## 🎥 2. The Screencast (Crucial Step)
Meta Reviewers **will reject** manual testing if they hit 2FA. You must provide a video.

**What to Record:**
1.  **Dashboard**: Login to your app.
2.  **Auth Flow**: Go to the "Channels" page and click "Connect Facebook".
3.  **Permissions**: Show the Facebook popup and select a Page/Instagram account.
4.  **Integration**: Show the "Success" message and the connected account appearing in the dashboard.
5.  **Messaging**: Send a message to your Facebook Page and show it arriving in the INTRA Inbox.

---

## 📝 3. Reviewer Instructions (Copy & Paste)
Paste this into the **"Reviewer Instructions"** text box in the submission form:

> **Accessing the Application:**
> Our platform is accessible at **https://intrabox.com.ng/login**.
> 
> **Testing Meta APIs:**
> Please refer to the **attached screencast video** for a full functional demonstration of the Facebook Login and API integration.
> 
> Due to mandatory Two-Factor Authentication (2FA) and security triggers on live Facebook accounts, manual testing of the OAuth flow by external reviewers is often blocked by Facebook's own security protocols. The attached video shows the user authorizing the app, permissions being granted, and data syncing correctly.
>
> To explore the app dashboard, you may use these test credentials:
> - **Email:** `meta-tester@intrabox.com.ng`
> - **Password:** `Tester2026!`

---

## 🛠️ 4. Final Submission Checklist
- [ ] **App Icon**: Ensure you have uploaded a high-quality app icon.
- [ ] **Category**: Set to "Business and Pages" or "Finance".
- [ ] **Contact Email**: Use `support@intrabox.com.ng`.
- [ ] **Tester Role**: Ensure you have a Facebook page connected to your app for the screencast.
- [ ] **Permissions Request**: Only ask for permissions you are actually using in the video (e.g., `pages_messaging`, `instagram_basic`).
