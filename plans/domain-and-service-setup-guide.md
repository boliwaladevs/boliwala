# Client Onboarding & Credentials Setup Guide

Project: Boliwala.com  
Business Structure: Sole Proprietorship

---

## 1. Domain Access (GoDaddy)

You do not need to configure any DNS records yourself. The development team will manage all domain pointing and verification.

Please share your GoDaddy login details so we can configure the domain settings:

- GoDaddy Username / Customer ID
- GoDaddy Password

---

## 2. Razorpay Setup (Payments & KYC)

Follow these steps to set up payments for your sole proprietorship.

### Step A: Send Test Credentials (Immediate - No KYC Required)

1. Sign up at **dashboard.razorpay.com**.
2. Toggle the switch at the top to **Test Mode**.
3. Go to **Account & Settings** → **API Keys** → **Generate Key**.
4. Copy and send us:
   - **Test Key ID** (starts with rzp*test*)
   - **Test Key Secret**

_This allows us to immediately build and test the payment gateway while your KYC is under review._

### Step B: Submit Live KYC (Sole Proprietorship)

Switch to **Live Mode** in Razorpay and complete the business details:

- **Business Type**: Sole Proprietorship
- **Business Category**: Real Estate → Real Estate Services
- **PAN Details**: Proprietor's personal PAN card number and full name
- **Bank Account**: Settlement bank account number and IFSC code

**Required Document Uploads:**

1. Proprietor PAN Card
2. Aadhaar Card (Front and Back)
3. Cancelled Cheque or Bank Passbook copy (must show account number and name matching PAN)
4. Business proof if requested (GST Certificate, Shop Act License, or Udyam Certificate)

### Step C: Send Live Credentials (After KYC Approval)

Once Razorpay approves your KYC (usually 3–7 business days):

1. Log in to Razorpay and ensure you are in **Live Mode**.
2. Go to **Account & Settings** → **API Keys** → **Generate Key**.
3. Copy and send us:
   - **Live Key ID** (starts with rzp*live*)
   - **Live Key Secret**

---

## 3. Required Contact Information

Please provide the following details to display on the website:

- Official Customer Support Phone Number
- Official WhatsApp Business Number
- Primary Business Email Address

---

## Checklist of Items to Send to Dev Team

- GoDaddy Username & Password
- Razorpay Test Key ID & Secret (rzp*test*...)
- Razorpay Live Key ID & Secret _(after KYC approval)_
- Official Phone Number & WhatsApp Number
