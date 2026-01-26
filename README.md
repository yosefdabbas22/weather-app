# Weather App

A modern, production-ready weather application built with Next.js, TypeScript, and Tailwind CSS. Search for any city worldwide and get current weather conditions plus a 5-day forecast powered by Open-Meteo APIs.

![Weather App](https://via.placeholder.com/800x400/0b0f14/ffffff?text=Weather+App)

## Features

- **Global City Search** - Search for any city worldwide with real-time geocoding
- **Geolocation** - Use your current location to get instant weather updates
- **Recent Searches** - Quick access to your recently searched cities (stored locally)
- **Temperature Unit Toggle** - Switch between Celsius (°C) and Fahrenheit (°F)
- **Current Weather** - View temperature, humidity, wind speed, and "feels like" temperature
- **5-Day Forecast** - Get detailed daily forecasts with high/low temperatures
- **Weather Icons** - Visual weather conditions using emoji icons based on WMO weather codes
- **Smart Caching** - 10-minute in-memory cache to reduce API calls and improve performance
- **Debounced Search** - Optimized search to prevent excessive API calls
- **Smooth Animations** - Beautiful fade-in transitions for better UX
- **Fully Responsive** - Optimized for mobile, tablet, and desktop devices
- **Accessible** - WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- **Dark UI** - Beautiful dark theme with clean, modern design

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **APIs**: [Open-Meteo](https://open-meteo.com/) (Geocoding & Weather Forecast)

## Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm package manager

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd weather-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000/] in your browser.

5. If You Want To Try The Website Click On This Link [https://weather-app-kohl-eight-74.vercel.app/]

### Building for Production

```bash
npm run build
npm start
```

## API Information

This app uses Open-Meteo APIs which are **free and require no API key**.

### APIs Used

1. **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search`
   - Converts city names to latitude/longitude coordinates
   - Returns top match for each search query

2. **Weather Forecast API**: `https://api.open-meteo.com/v1/forecast`
   - Provides current weather conditions and daily forecasts
   - Returns temperature, humidity, wind speed, weather codes, and more

### Weather Codes

The app uses WMO (World Meteorological Organization) weather interpretation codes to display weather conditions:

- **0**: Clear sky ☀️
- **1-2**: Partly cloudy 🌤️ ⛅
- **3**: Overcast ☁️
- **45-48**: Fog 🌫️
- **51-57**: Drizzle 🌦️ 🌨️
- **61-67**: Rain 🌧️ 🌨️
- **71-77**: Snow ❄️
- **80-86**: Showers 🌦️ 🌧️ 🌨️
- **95-99**: Thunderstorms ⛈️

## Project Structure

```
weather-app/
├── app/
│   ├── api/
│   │   └── weather/
│   │       └── route.ts          # API route handler with caching
│   ├── globals.css               # Global styles and Tailwind directives
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── ForecastRow.tsx           # Individual forecast row component
│   ├── ForecastTable.tsx         # Forecast table wrapper
│   ├── SearchBar.tsx             # Search input component
│   └── StatCard.tsx              # Stat card component
├── lib/
│   └── weatherCodes.ts           # Weather code to icon/label mapping
└── public/                       # Static assets
```

## Features in Detail

### Search Functionality

- Type a city name and press Enter to search
- Real-time geocoding finds the best match
- Handles invalid cities with clear error messages

### Current Weather Display

- **Temperature**: Current temperature in Fahrenheit
- **Humidity**: Relative humidity percentage
- **Wind Speed**: Wind speed in miles per hour
- **Feels Like**: Apparent temperature accounting for wind and humidity

### 5-Day Forecast

- Shows next 5 days of weather
- Displays high/low temperatures for each day
- Weather condition labels and icons
- Responsive table layout (stacks on mobile)

### State Management

- **Empty State**: Shows helpful message before first search
- **Loading State**: Skeleton placeholders during API fetch
- **Error State**: Clear error messages for failed requests or invalid cities
- **Success State**: Full weather data display

## Bonus Features

### Temperature Unit Toggle (UI Ready)

The app includes a temperature unit toggle UI in the header. The infrastructure is in place to switch between Celsius (°C) and Fahrenheit (°F). Currently displays Fahrenheit by default.

### Smart Caching

- In-memory cache with 10-minute TTL
- Reduces API calls for repeated searches
- Automatic cache invalidation

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support (Enter to search)
- Semantic HTML structure
- Screen reader friendly

## Deployment

### Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Deploy on Other Platforms

This Next.js app can be deployed on any platform that supports Node.js:

- **Netlify**: Connect your Git repository or use the Netlify CLI
- **Railway**: Connect via GitHub or use Railway CLI
- **AWS**: Use AWS Amplify or Elastic Beanstalk
- **Docker**: Build and deploy using the included Dockerfile (if provided)

## Live Demo

🌐 **Live URL**: [Add your deployed URL here]

Example: `https://weather-app.vercel.app`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Code Quality

This project uses:
- **ESLint** - Code linting and quality checks
- **Prettier** - Code formatting
- **TypeScript** - Type safety

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes following our [Git Workflow](GIT_WORKFLOW.md)
4. Commit using [Conventional Commits](GIT_WORKFLOW.md#conventional-commits)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request using our [PR Template](.github/PULL_REQUEST_TEMPLATE.md)

### Git Workflow

We follow a structured Git workflow with Conventional Commits. See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for details.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for providing free weather APIs
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

Built with using Next.js + TypeScript + Tailwind CSS
