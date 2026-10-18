# SMS OTP Delivery & Cost Architecture in India

This document explains the technical requirements, regulatory framework (TRAI / DLT), and costs associated with SMS OTP delivery in India, along with how to operate the trial at **₹0 cost**.

---

## 1. How to Test at ₹0 Cost (Trial Phase)

Sending commercial SMS in India requires paid third-party SMS providers and strict regulatory approval. For the trial phase, you **do not need to spend any money**.

### Supabase Native Test Phone Numbers (100% Free)

Supabase Auth provides built-in **Test Phone Numbers** that require zero SMS gateways and zero credits:

1. Open your Supabase Dashboard &rarr; **Authentication** &rarr; **Providers** &rarr; **Phone**.
2. Scroll to **Test phone numbers**.
3. Add your trial numbers:
   - Admin: `+919876543210` with fixed OTP `123456`
   - Imam: `+919876543211` with fixed OTP `123456`
4. When testing on the website, enter these phone numbers and use `123456`. Supabase validates the session instantly without sending an actual SMS.

### Built-in Trial Demo Mode

If Supabase is not connected yet, the website's built-in **Trial Demo Mode** allows 1-click login and simulates the exact same database mutations and RLS checks in `localStorage`.

---

## 2. Moving to Production: Paid SMS Requirements in India

When expanding beyond the trial to all masjids across Kalupur and sending real SMS to Imams' personal phones, the following services and regulations apply:

### A. Telecom Regulatory Authority of India (TRAI) & DLT Registration

In India, commercial and transactional SMS cannot be sent without **Distributed Ledger Technology (DLT)** registration on telecom operator portals (e.g. Jio, Airtel, Vodafone Idea, or BSNL DLT portal).

1. **Entity Registration:** The Masjid Trust or Committee must register as a Principal Entity (~₹5,900 one-time fee charged by telecom operators).
2. **Sender ID (Header):** Register an approved 6-character sender ID (e.g. `KPTMNG` or `MSJTIM`).
3. **Template Approval:** Register the exact OTP message template:
   > *"Your Kalupur Masjid Timings verification code is {#var#}. Valid for 10 minutes. Please do not share this OTP."*

### B. SMS Gateway Providers & Per-Message Pricing

Once DLT registration is approved, integrate a supported SMS provider with Supabase Auth:

| Provider | Supported in Supabase? | Approx. Cost per Domestic SMS (India) | Notes |
|---|---|---|---|
| **Twilio** | Native Supabase Support | ~₹0.35 - ₹0.60 per SMS + Twilio monthly fee | Global standard, easy setup |
| **MessageBird / Bird** | Native Supabase Support | ~₹0.30 - ₹0.50 per SMS | Good international coverage |
| **Msg91** | Via Supabase Custom SMS Hook / Webhook | ~₹0.15 - ₹0.22 per SMS | Popular in India, affordable |
| **Fast2SMS** | Via Supabase Custom SMS Hook / Webhook | ~₹0.15 - ₹0.20 per SMS | Budget Indian provider |

### Estimated Ongoing Cost for Kalupur Masjids:

- **Imams typically log in once and stay logged in** because the website uses persistent Supabase sessions (persisted in secure browser storage).
- Assuming 15 masjids in Kalupur:
  - 15 Imams logging in 2 to 4 times a month = ~30 to 60 SMS per month.
  - Monthly SMS cost: **~₹10 to ₹25 per month** (less than a cup of tea).
- The only barrier is the one-time DLT entity registration fee for Indian telecom compliance.

---

## 3. Alternative Cost-Effective Production Options

If the mosque committee wishes to avoid DLT registration and SMS costs completely:

1. **Email / Magic Link Authentication:** 100% free with Supabase (up to 50,000 active users/month).
2. **WhatsApp OTP (via Twilio / Gupshup):** Can be used as an alternative to SMS.
3. **Admin-Assigned Device Passcodes:** Administrators can assign 6-digit permanent PINs to authorized Imams.
