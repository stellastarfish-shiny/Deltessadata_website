# Deltessa Data website and client management system

Plain HTML, CSS and JavaScript. Supabase (free tier) is the backend, Web3Forms emails the contact form.

```
index.html     public single-page site        login.html   admin login
style.css      site styles                    admin.html   client management system
script.js      site behaviour + contact form  admin.css / admin.js
config.js      YOUR KEYS GO HERE              supabase.sql database setup
images/logo.png  transparent logo
```

## 1. Run it locally
Open the folder in VS Code and use the Live Server extension (right-click `index.html` > Open with Live Server), or run `python -m http.server 5500` and visit http://localhost:5500.
The site already looks complete before you add keys. The contact form and admin need steps 2 to 4.

## 2. Set up Supabase (free tier)
1. Create a project at supabase.com. Save the database password somewhere safe.
2. **SQL Editor > New query**, paste all of `supabase.sql`, click **Run**. This creates the tables and locks them down (Row Level Security).
3. **Project Settings > API**: copy the **Project URL** and the **anon public** key into `config.js`. Never use the `service_role` key here.
4. **Authentication > Users > Add user > Create new user**: enter the Lead Data Analyst's email and a strong password, and tick auto-confirm. This is the only admin account.
5. **Authentication** settings: switch off **Allow new users to sign up** so nobody else can register.

## 3. Set up the contact form email (Web3Forms)
1. Go to web3forms.com and create an access key using `info@deltessadata.co.ke`. Confirm the verification email they send.
2. Paste the key into `WEB3FORMS_ACCESS_KEY` in `config.js`.
Every message is sent to Supabase and emailed. If one of the two fails, the other still goes through. Check Web3Forms for their current free-plan limits.

## 4. Test
1. Open `index.html`, send a test message from the contact form. Check the inbox and **Admin > Messages**.
2. Open `login.html`, sign in, and add a client, a job (with charge and amount paid), and a log. Use **+ Payment** on a job to record a payment.

## 5. Replace the placeholders
Highlighted text (class `ph`, gold dashed underline) in `index.html` is placeholder content. Search the file for `class="ph"` and `[` to find all of them:
- Analyst name, bio, qualifications, certifications, background, achievements
- Phone number and office location in the contact section
- Photo: save as `images/analyst.jpg` and replace the `.avatar` div with `<img class="avatar" src="images/analyst.jpg" alt="Lead Data Analyst">`
- CV: put the PDF at `docs/CV.pdf` and change the Download CV link `href="#"` to `docs/CV.pdf`
- Social links in the footer (`href="#"`)
- Vision, mission and service wording are draft copy; ask the client to approve it
Remove `class="ph"` once real text is in.

## 6. What the admin can do
- **Clients**: add, edit, delete, search. Click a client to see their full service history, jobs and log.
- **Jobs**: description, service, status (In Progress, Pending Review, Completed), sign-on, due and completion dates, amount charged, amount paid. Balance is calculated. A job shows **Arrears** when it has an unpaid balance and is completed or past its due date.
- **Client logs**: dated calls, meetings, emails and notes.
- **Messages**: contact-form submissions, with mark-read, reply and delete.
Deleting a client also deletes their jobs and logs.

## 7. Deploy
- Any static host works: Netlify, Cloudflare Pages, GitHub Pages, or cPanel upload for the .co.ke domain. Upload the whole folder.
- Point the domain's DNS to the host, then in Supabase **Authentication > URL Configuration** set the Site URL to the live address.

## 8. Free-tier notes
- Supabase free projects pause after a period of inactivity (about a week at the time of writing). Sign in to the admin at least weekly, or restore the project from the dashboard.
- The free plan does not give you dependable backups. Export the tables to CSV from the Table Editor regularly.
- The anon key in `config.js` is public by design. Security comes from the Row Level Security rules in `supabase.sql` and from disabled sign-ups.

## 9. Handover checklist
Live site on the client's domain, admin login credentials given to the client, sign-ups disabled, placeholders replaced, contact form tested end to end, CSV export shown to the client.
