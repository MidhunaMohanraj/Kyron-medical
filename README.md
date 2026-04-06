# 🏥 Kyron Medical – AI Patient Assistant

A full-stack AI-powered patient intake and appointment scheduling web app.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| AI | Claude claude-sonnet-4-20250514 (Anthropic) |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| SMS | Twilio |
| Voice AI | Vapi.ai |
| Hosting | AWS EC2 + nginx + HTTPS |

---

## ⚡ Local Setup (Step by Step)

### Step 1: Create accounts (all free tiers work)

1. **Anthropic** → https://console.anthropic.com → Create API key
2. **Supabase** → https://supabase.com → New project → copy URL + service role key
3. **Resend** → https://resend.com → Create API key (add & verify a sending domain)
4. **Twilio** → https://twilio.com → Get Account SID, Auth Token, buy a phone number
5. **Vapi.ai** → https://vapi.ai → Create assistant, get API key + phone number ID

---

### Step 2: Set up the database

1. Go to your Supabase project → SQL Editor
2. Paste the entire contents of `backend/db/schema.sql`
3. Click **Run** — this creates all tables and seeds 4 doctors + 60 days of slots

---

### Step 3: Set up the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in all your API keys, then:

```bash
npm install
npm run dev
```

You should see: `🏥 Kyron Medical Backend running on port 3001`

Test it: http://localhost:3001/health

---

### Step 4: Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — you should see the chat interface!

---

### Step 5: Set up Vapi Voice AI

1. Log in to https://vapi.ai
2. Create a new **Assistant**:
   - Name: `Aria - Kyron Medical`
   - System prompt: *Use the SYSTEM_PROMPT from `backend/services/aiService.js`*
   - Model: GPT-4o or Claude claude-sonnet-4-20250514
   - Voice: Choose a professional female voice (e.g. Alloy, Shimmer)
3. Buy a phone number in Vapi → copy the **Phone Number ID**
4. Assign the assistant to that phone number
5. Copy your **Assistant ID** and **API Key** into `.env`

---

## 🚀 EC2 Deployment

### Step 1: Launch EC2 instance
- AMI: Ubuntu 22.04 LTS
- Instance type: t3.small (recommended) or t2.micro (free tier)
- Security group: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Create or use existing key pair

### Step 2: Connect to your instance
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 3: Run deployment script
```bash
# Upload your code (or git clone)
git clone https://github.com/YOUR_USERNAME/kyron-medical.git

# Run the setup script
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Add your .env file
```bash
cd /home/ubuntu/kyron-medical/backend
nano .env
# Paste all your environment variables
pm2 restart kyron-backend
```

### Step 5: Set up a domain + HTTPS
- Point your domain's A record to your EC2 Elastic IP
- Edit `/etc/nginx/sites-available/kyron-medical` → replace `YOUR_DOMAIN_OR_IP`
- Run: `sudo certbot --nginx -d yourdomain.com`
- Auto-renewal: `sudo certbot renew --dry-run`

---

## 📁 Project Structure

```
kyron-medical/
├── backend/
│   ├── db/
│   │   ├── schema.sql          # Database schema + seed data
│   │   └── supabase.js         # DB client
│   ├── routes/
│   │   ├── chat.js             # Chat API
│   │   ├── admin.js            # Admin API
│   │   └── voice.js            # Voice call API
│   ├── services/
│   │   ├── aiService.js        # Claude AI + tool loop
│   │   ├── doctorService.js    # Doctor matching + slot management
│   │   ├── emailService.js     # Confirmation emails
│   │   ├── smsService.js       # SMS notifications
│   │   └── conversationService.js  # Session persistence
│   ├── server.js               # Express app
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatMessage.jsx     # Message bubbles
│   │   │   ├── TypingIndicator.jsx # Animated dots
│   │   │   ├── VoiceCallModal.jsx  # Voice handoff UI
│   │   │   └── QuickReplies.jsx    # Suggested actions
│   │   ├── pages/
│   │   │   └── AdminDashboard.jsx  # Admin panel
│   │   ├── hooks/
│   │   │   └── useChat.js          # Chat state + session restore
│   │   ├── utils/
│   │   │   └── api.js              # API calls
│   │   ├── App.jsx                 # Main chat UI
│   │   └── main.jsx                # Router
│   └── .env.example
└── deploy.sh                   # EC2 setup script
```

---

## 🔒 Non-Happy Path Scenarios Handled

1. **Slot no longer available** — if a slot gets booked between when AI shows it and patient selects it, booking fails gracefully with a message to choose another time
2. **No matching doctor** — if patient's condition doesn't match any provider, AI informs them clearly
3. **Session restore** — if page is refreshed, conversation is restored from database
4. **Email/SMS failure** — these are non-fatal; appointment is still booked if notifications fail
5. **Rate limiting** — API endpoints are rate limited at 100 req/15min

---

## 🌟 Bonus Features

- **Session persistence** — refresh the page, conversation continues seamlessly
- **Voice context handoff** — web chat history is summarized and passed to Vapi voice agent
- **Quick reply buttons** — common patient actions shown on first load
- **Admin real-time updates** — slot changes immediately affect AI responses
- **Appointment management** — admin can mark appointments complete/cancelled
