# Business Management Application

A comprehensive business management solution with accounting, inventory, and order management modules.

## Features

### Accounting Module
- Record purchases with deferred payment options
- Manage credit cards and track payment due dates
- Calendar view for payment scheduling
- Monthly expense summaries
- Export functionality for reports

### Inventory Module
- Product management (add, edit, delete)
- Stock level tracking with alerts
- Advanced filtering and search
- Product categorization
- Inventory movement history

### Orders Module
- Create and manage customer orders
- Automatic price calculation (wholesale/retail)
- Order status tracking
- Sales analytics and reporting
- Invoice generation

## Tech Stack

- React 18 with TypeScript
- Material-UI for UI components
- Firebase for backend services
- React Router for navigation
- Recharts for data visualization
- date-fns for date handling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase configuration (see .env.example)
4. Start the development server:
   ```bash
   npm start
   ```

## Deployment

This project is configured for deployment to GitHub Pages:

1. Run the build:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Environment Variables

Create a `.env` file in the root directory with the following Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## License

This project is licensed under the MIT License.
