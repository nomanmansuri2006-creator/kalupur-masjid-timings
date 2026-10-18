# Secure First Administrator Provisioning Guide

To ensure security, **no visitor is ever automatically made an administrator**. All administrative roles are guarded by Row Level Security (RLS) in the PostgreSQL database.

Follow these steps to securely provision the initial administrator account.

---

## Method 1: Provisioning via Supabase Dashboard (Recommended)

### Step 1: Create the User in Supabase Auth

1. Go to your Supabase Project Dashboard.
2. In the left navigation, click **Authentication** &rarr; **Users**.
3. Click **Add user** (or **Invite user**):
   - **Option A (Phone Auth):** Enter the admin's phone number, e.g., `+919876543210` with a confirmed status (or use the test phone number configured in `Authentication -> Providers -> Phone -> Test phone numbers`).
   - **Option B (Email Auth):** Enter the admin's email (e.g. `admin@kalupurmasjid.org`) and a strong password. Check **Auto Confirm User**.
4. Click **Create user**.
5. Once created, click on the user record in the list and copy their **User UID** (a UUID like `e8a3b50c-1234-4567-89ab-cdef01234567`).

---

### Step 2: Bind User to the Administrator Role in Database

1. In the Supabase Dashboard, go to **SQL Editor**.
2. Run the following SQL query, replacing `<PASTE_ADMIN_USER_UID_HERE>` with the copied UID:

```sql
INSERT INTO public.profiles (
    id,
    display_name,
    phone,
    role,
    assigned_masjid_id,
    active
)
VALUES (
    '<PASTE_ADMIN_USER_UID_HERE>',
    'Kalupur Central Administrator',
    '+919876543210',
    'admin',
    NULL,
    TRUE
)
ON CONFLICT (id) DO UPDATE
SET
    role = 'admin',
    active = TRUE;
```

3. Click **Run**.
4. The administrator account is now active and authorized. When this user logs in through the portal, the application verifies the `profiles.role = 'admin'` through RLS policies and grants access to the Administrator Dashboard.

---

## How to Provision an Imam Account

Once the Administrator is logged into the portal, they can authorize new Imams directly from the **Manage Imams** tab in the Administrator Console.

Alternatively, to manually provision an Imam via SQL:

1. Create the user in **Authentication** &rarr; **Users** with their mobile number (e.g. `+919876543211`).
2. Copy their **User UID**.
3. Run the following SQL in the SQL Editor:

```sql
INSERT INTO public.profiles (
    id,
    display_name,
    phone,
    role,
    assigned_masjid_id,
    active
)
VALUES (
    '<PASTE_IMAM_USER_UID_HERE>',
    'Imam Maulana Abdullah',
    '+919876543211',
    'imam',
    'a0000000-0000-0000-0000-000000000001', -- Trial Masjid ID
    TRUE
)
ON CONFLICT (id) DO UPDATE
SET
    role = 'imam',
    assigned_masjid_id = 'a0000000-0000-0000-0000-000000000001',
    active = TRUE;
```

---

## Revoking Access

If an Imam leaves the masjid or changes their mobile phone:

1. The Administrator can open **Administrator Console** &rarr; **Manage Imams** and click **Revoke Access**.
2. This immediately disables the Imam's ability to submit timing updates (enforced by RLS policies: `active = true`).
3. To assign a new Imam, click **Change Masjid** and link the new Imam's account.
