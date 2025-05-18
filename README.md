# Art of Living - Sahaj Samadhi Meditation App

A Next.js application for Art of Living's Sahaj Samadhi Meditation course purchase and confirmation flow. This app includes a secure checkout process with Stripe integration and a confirmation page.

## Features

- Course checkout page with Stripe Elements integration
- User information collection form
- Thank you / confirmation page after purchase
- Responsive design for all device sizes
- Integration with external API server

## Technologies Used

- Next.js 14 (Pages Router)
- TypeScript
- Tailwind CSS
- ShadCN UI Components
- Stripe Payment Integration

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/aolf-meditation-app.git
cd aolf-meditation-app
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_API_URL=https://api.artofliving.org
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

### Building for Production

```bash
npm run build
# or
yarn build
```

### Starting Production Server

```bash
npm start
# or
yarn start
```

## Project Structure

- `/src/pages` - Next.js pages
  - `/checkout/[courseId].tsx` - Checkout page
  - `/thankyou/[orderId].tsx` - Thank you page
- `/src/components` - Reusable components
- `/src/lib` - Utility functions and API clients
- `/public` - Static assets

## API Integration

This application connects to an external API server for:

1. Fetching course information
2. Processing payments
3. Retrieving order details

The API endpoints used are:

- `GET /api/courses/{courseId}` - Get course details
- `GET /api/orders/{orderId}` - Get order details
- `POST /api/checkout` - Process payment and create order

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
