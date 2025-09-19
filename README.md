Pirate Chatbot Starter

Setup:
1. Install dependencies:
   npm install

2. Run development server:
   npm run dev

3. Build:
   npm run build

Lambda:
- The lambda handler is in /lambda/handler.ts
- Deploy with your preferred tool (Serverless, SAM, CDK). Set OPENAI_API_KEY env var.

Notes:
- This starter expects you to configure a proxy or API gateway route /api/chat that points to the Lambda.
- Do not commit your OpenAI API key to source control.
