**Project Requirements Document**

**Project Title:** Art of Living - Course Purchase and Confirmation Pages

**Prepared By:** \[Your Name / Team Name]
**Date:** \[Enter Date]

---

### 1. Project Overview

This project involves building a two-page checkout and confirmation flow for Art of Living course purchases. It will use modern tooling, secure Stripe integration, and responsive UI with ShadCN components.

### 2. Objectives

- Implement a responsive checkout page using Stripe Elements to tokenize credit card data.
- Redirect users to a confirmation page post-payment.
- Ensure security, PCI compliance, and production-grade performance.

### 3. Scope

**In Scope:**

- Checkout page using Stripe tokenization.
- Thank You page with order confirmation.
- URL parameter parsing for `courseId` and `orderId`.
- Integration with existing backend API.

**Out of Scope:**

- Admin portal, catalog browsing, or backend logic.
- Alternate payment methods (non-Stripe).

### 4. Technical Architecture

- **Framework:** Next.js v14 (Pages Router)
- **UI Library:** ShadCN
- **Payment Gateway:** Stripe (using Stripe.js and Elements)
- **Language:** TypeScript
- **Deployment:** Heroku
- **Backend:** Existing API server (no API-side logic required)

### 5. Folder Structure

```
/pages
  /checkout.tsx       → Checkout Page (uses courseId param)
  /thankyou.tsx       → Thank You Page (uses orderId param)
/components
  /CheckoutForm.tsx
  /CourseSummaryCard.tsx
  /StripeCardInput.tsx
  /ConfirmationSection.tsx
/lib
  /api.ts             → API handlers for course and order
  /stripe.ts          → Stripe init and helpers
```

### 6. Page Requirements

#### **/checkout**

- **Route:** `/checkout/xyz`
- **Functionality:**

  - Parse `courseId` from URL path
  - Fetch course data (`GET /api/course?courseId=xyz`)
  - Collect user info (name, email, address, phone)
  - Display course summary and cost
  - Integrate Stripe Elements for credit card input
  - On submit: tokenize card and call `/api/payment`
  - On success: redirect to `/thankyou/abc`

#### **/thankyou**

- **Route:** `/thankyou/abc`
- **Functionality:**

  - Parse `orderId` from URL path
  - Fetch order data (`GET /api/order?orderId=abc`)
  - Display summary (date, amount, contact info, etc)

### 7. API Contracts

#### **GET /api/course?courseId=xyz**

```ts
{
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  price: number;
}
```

#### **POST /api/payment**

```ts
Request: {
  token: string; // Stripe token
  user: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  }
  courseId: string;
}

Response: {
  orderId: string;
}
```

#### **GET /api/order?orderId=xyz**

```ts
{
  orderId: string;
  courseTitle: string;
  amount: number;
  purchasedAt: string;
  userEmail: string;
}
```

### 8. Stripe Setup

- Use `@stripe/stripe-js` to load Stripe client
- Tokenize cards using `CardElement` from `@stripe/react-stripe-js`
- Use `.env.local` to store:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

- Never store card numbers. Use token returned from Stripe only.

### 9. Non-Functional Requirements

- **Performance:** Page load time < 2s
- **Security:** PCI compliant; never handle raw card data
- **Accessibility:** Keyboard-navigable and screen-reader friendly
- **Responsiveness:** Fully responsive UI as per provided screenshot

### 10. Appendices

- **Appendix A:** Checkout Page Screenshot
- **Appendix B:** Stripe Integration Docs
- **Appendix C:** Brand Guidelines / Style Guide

---

Let Cursor use this doc to auto-generate page scaffolds, Stripe code snippets, and test API mocks.
