# Synthetica - AI Synthetic Data Generator

Synthetica is an AI-powered synthetic data generation tool that leverages Google's Gemini API to create realistic, structured datasets for various purposes. Whether you need test data for development, sample data for demonstrations, or anonymized data for privacy concerns, Synthetica offers a quick and efficient solution.

![Synthetica Logo](public/Synthetica_Logo.png)

## Features

- **AI-Powered Data Generation**: Utilizes Google Gemini API for intelligent, context-aware data generation
- **Multiple Output Formats**: Generate data in JSON, CSV, SQL, XML, or YAML formats
- **Customizable Data Volume**: Create anywhere from 1 to 1000 data entries at once
- **Batch Processing**: Handles large requests efficiently through intelligent batching
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Animations**: Engaging user experience with Framer Motion animations

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RishikarthikVelliangiri/Synthetica_Functionality_Vercel.git
cd Synthetica_Functionality_Vercel
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Google Gemini API key:
```
GOOGLE_API_KEY=your_google_gemini_api_key_here
GOOGLE_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp:generateContent
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a description of the data you want to generate in the input field
2. Select the desired output format (JSON, CSV, SQL, XML, or YAML)
3. Specify the number of entries to generate
4. Click "Generate Data" and wait for the results
5. Copy or download the generated data for use in your projects

## Example Prompts

- "Create customer profiles with name, email, age, and purchase history"
- "Generate product data with IDs, names, categories, prices, and inventory levels"
- "Make a dataset of employee records with personal and professional details"
- "Create financial transaction data with dates, amounts, and categories"

## Deployment on Vercel

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| GOOGLE_API_KEY | Your Google Gemini API key |
| GOOGLE_API_URL | URL of the Gemini API endpoint |

## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS with Shadcn UI components
- **Animations**: Framer Motion
- **AI API**: Google Gemini
- **Deployment**: Vercel-ready

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Powered by [Google Gemini](https://ai.google.dev/) AI models
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)