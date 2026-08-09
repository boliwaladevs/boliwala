# Action Required: WhatsApp & SMS Authentication Setup

To implement phone number verification with the lowest possible costs (₹0.13 for WhatsApp, ~₹0.18 for SMS), we need you to complete two regulatory/setup processes.

---

## 1. Meta WhatsApp Cloud API (For 13 Paisa WhatsApp OTPs)

By using Meta's direct API, we cut out middlemen platforms and pay the absolute base rate. To enable this, we need a **Permanent Access Token** from a verified Meta Developer account.

### Client Action Checklist:
1. **Meta Business Manager**: Log into your Facebook Business Manager (`business.facebook.com`).
2. **Business Verification**: Navigate to Security Center and complete Business Verification. You will need to upload legal documents (GST Certificate, Certificate of Incorporation, etc.) to prove Boliwala is a real entity. *Note: Meta can take 1–3 days to approve this.*
3. **Dedicated Phone Number**: You must provide a phone number to serve as the official Boliwala sender. **CRITICAL:** This number cannot currently be registered on the standard WhatsApp or WhatsApp Business mobile app. It must be a clean/unregistered number.
4. **Billing Setup**: Add a credit card to the Meta Developer console to pay Meta directly for the message costs.
5. **Generate Token**: Create a "System User" in Business Manager and generate a Permanent Access Token.

**Once they do this, they generate a Permanent Access Token, which we will plug into our Supabase Edge Function to send the OTPs.**

---

## 2. DLT Registration (For Cheap Domestic SMS)

If a user prefers SMS, we need to fall back to standard SMS. Due to strict TRAI regulations in India, we cannot send cheap domestic SMS without a registered Sender ID. If we bypass this, we are forced to use international routes (ILDO) which cost ₹4.00 to ₹6.00 per OTP!

To get local rates (~₹0.18 per SMS), you must complete **DLT (Distributed Ledger Technology) Registration**.

### Client Action Checklist:
1. **Choose a DLT Portal**: Register Boliwala as a Principal Entity on any Indian telecom DLT portal (e.g., Jio, Airtel, Vilpower). There is typically a one-time registration fee charged by the telecom operator.
2. **Entity Approval**: Submit your PAN/GST details for verification (takes 2–3 days).
3. **Register Headers (Sender ID)**: Register a 6-letter alphabetic Sender ID (e.g., `BOLIWA`).
4. **Register Content Template**: Register the exact message template we will use. Example: *"Your Boliwala verification code is {#var#}. Do not share this with anyone."*

---

## 3. How We Will Integrate This into Supabase

Once the above two steps are completed by your team, here is how the development team will build it out:

### WhatsApp Flow
- **Provider**: Meta WhatsApp Cloud API (Direct)
- **Integration**: We will use **Supabase Custom Auth Hooks**. When a user requests an OTP, Supabase securely generates the 6-digit code and triggers our custom Edge Function. The Edge Function instantly makes a direct HTTP POST call to Meta using your Permanent Access Token.

### SMS Flow
- **Provider**: MSG91 (Highly reliable, cheapest and best suited for India).
- **Integration**: We will create an MSG91 account and configure it with your approved DLT Sender ID and Template ID. 
- Using the same **Supabase Custom Auth Hook** architecture, if the user clicks "Send via SMS", our Edge Function will intercept the request and fire an MSG91 API call instead of Meta, delivering the local SMS at ~₹0.18.

**Immediate Next Step**: Please begin the Meta Business Verification and DLT Entity Registration immediately, as both processes require manual document review by third parties (Meta and Telecom Operators) and can take anywhere from 3 to 7 days to fully resolve.
