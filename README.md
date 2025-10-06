# Moon Transit Tracker 🌙✈️

A real-time web application that tracks when aircraft will pass in front of the moon from your location, perfect for planning spectacular photography shots.

## Features

### 🎯 **Real-Time Tracking**
- Live aircraft position tracking with multiple ADS-B data sources
- Support for ADSB.One (10s updates) and OpenSky Network (60s updates)
- Precise moon position calculations based on your location
- Real-time transit predictions and updates

### 🗺️ **Dual Visualization**
- **Sky Map**: Overhead view showing aircraft and moon positions
- **Horizon View**: Side profile with compass for directional reference
- Interactive help system to understand the visualizations

### 📸 **Photography Assistant**
- Camera settings recommendations (ISO, aperture, shutter speed)
- Optimal timing guidance for transit photography
- Equipment suggestions for best results

### 🧭 **Location Awareness**
- Automatic geolocation detection
- Precise astronomical calculations for your coordinates
- Altitude and elevation considerations

## Live Demo

🚀 **[View Live Application](https://arthurkok2.github.io/moon-plane-transit/)**

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide React icons
- **Astronomy**: Astronomy Engine library for precise celestial calculations
- **Flight Data**: OpenSky Network REST API
- **Deployment**: GitHub Pages with automated CI/CD

## Development

### Prerequisites
- Node.js 20+ (see `.nvmrc`)
- npm or yarn package manager

### Getting Started

```bash
# Clone the repository
git clone https://github.com/arthurkok2/moon-plane-transit.git
cd moon-plane-transit

# Use the correct Node.js version
nvm use

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## ADS-B Data Sources

The app supports multiple ADS-B data sources that you can select from:

### ADSB.One (Default)
- **Rate Limit**: 1 request per second
- **Update Frequency**: 10 seconds
- **Coverage**: High-quality data with excellent coverage
- **Max Radius**: 463km (250 nautical miles)
- **Best For**: Real-time tracking with faster updates

### OpenSky Network
- **Rate Limit**: 400 requests/day (anonymous users)
- **Update Frequency**: 60 seconds
- **Coverage**: Global, community-driven network
- **Max Radius**: 250km
- **Best For**: General use, no registration required

The data source can be changed in the app interface, and your preference is saved locally.

### Project Structure

```
src/
├── components/          # React components
│   ├── CameraAssistant.tsx    # Photography guidance
│   ├── DataSourceSelector.tsx # ADS-B source selection
│   ├── FlightList.tsx         # Aircraft list with details
│   ├── HorizonView.tsx        # Side view with compass
│   ├── MoonInfo.tsx           # Moon phase and position
│   ├── SkyMap.tsx             # Overhead sky visualization
│   └── TransitList.tsx        # Predicted transits list
├── hooks/               # Custom React hooks
│   ├── useDataSource.ts       # ADS-B source management
│   ├── useFlightTracking.ts   # Aircraft data management
│   ├── useGeolocation.ts      # Location services
│   ├── useLocalStorage.ts     # Browser storage
│   └── useMoonTracking.ts     # Moon position tracking
├── lib/                 # Core logic and utilities
│   ├── astronomy.ts           # Celestial calculations
│   ├── flights.ts             # Flight data processing
│   └── transitDetector.ts     # Transit prediction engine
└── test/                # Test files
```

## How It Works

1. **Location Detection**: Automatically detects your geographic coordinates
2. **Data Retrieval**: Fetches real-time aircraft positions from OpenSky Network
3. **Astronomical Calculations**: Computes precise moon position and phase
4. **Transit Prediction**: Analyzes aircraft trajectories to predict moon transits
5. **Visualization**: Displays results in intuitive sky maps and horizon views
6. **Photography Guidance**: Provides camera settings and timing recommendations

## Photography Tips

### Equipment Recommendations
- **Telephoto lens**: 200mm+ for detailed moon shots
- **Sturdy tripod**: Essential for sharp images
- **Remote shutter**: Minimize camera shake
- **Fast memory card**: For burst mode photography

### Camera Settings
- **Manual mode**: Full control over exposure
- **Fast shutter**: 1/500s or faster to freeze aircraft
- **Moderate aperture**: f/5.6-f/8 for sharpness
- **Low ISO**: 100-400 to minimize noise

### Timing
- Start shooting **before** predicted transit time
- Use **burst mode** during the transit window
- Account for **prediction uncertainty** (±30 seconds)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage
- Use conventional commit messages
- Ensure responsive design compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **[OpenSky Network](https://opensky-network.org/)**: For providing free, community-driven aircraft tracking data
- **[ADSB.One](https://adsb.one/)**: For providing high-quality ADS-B data with excellent coverage  
- **[Astronomy Engine](https://github.com/cosinekitty/astronomy)**: For precise astronomical calculations
- **React Community**: For the excellent ecosystem and tools

## Data Sources

- **Flight Data**: [OpenSky Network](https://opensky-network.org/) • [ADSB.One](https://adsb.one/)
- **Astronomical Calculations**: [Astronomy Engine](https://github.com/cosinekitty/astronomy)

---

**Happy sky watching and photography! 📸🌙✈️**