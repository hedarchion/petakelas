# Petakelas - AI Agent Guide

## Project Overview

Petakelas is a modern, dark-themed web application designed to help teachers create, visualize, and export classroom seating plans. It features an interactive grid editor with a "vibecoding" aesthetic (Zinc & Emerald theme), A4-optimized export capabilities, and responsive design.

**Key Features:**
- Interactive grid editor for placing students, teacher desks, and corridors
- Cell merging for creating larger desks or lab tables
- Undo/Redo functionality with history (last 50 states)
- High-resolution PNG export using html2canvas
- Responsive design with mobile view-only mode
- A4/Letter paper aspect ratio optimization

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6.4 |
| Styling | Tailwind CSS (via CDN) |
| Icons | Lucide React |
| Export | html2canvas (via CDN) |
| Module System | ES Modules |

## Project Structure

```
petakelas/
├── index.html              # Entry point with CDN imports and import maps
├── index.tsx               # React application root
├── App.tsx                 # Main application component with state management
├── types.ts                # TypeScript type definitions
├── Sidebar.tsx             # ⚠️ Legacy file (NOT used - see components/Sidebar.tsx)
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript compiler configuration
├── package.json            # NPM scripts and dependencies
├── .env.local              # Environment variables (GEMINI_API_KEY)
├── metadata.json           # Project metadata
├── components/
│   ├── Button.tsx          # Reusable button component with variants
│   ├── GridCanvas.tsx      # Main grid rendering and layout logic
│   ├── GridCell.tsx        # Individual cell component (student/teacher/corridor)
│   ├── Sidebar.tsx         # Settings panel component (ACTIVE version)
│   └── Toolbar.tsx         # Tool selection sidebar
└── dist/                   # Build output directory (gitignored)
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

**Note:** The `predeploy` script automatically runs `npm run build` before deployment.

## Architecture Details

### State Management
State is managed at the top level in `App.tsx` using React hooks:
- `cells`: Array of placed cells (students, teachers, corridors)
- `gridConfig`: Grid dimensions, board position, auto-resize setting
- `classInfo`: Class name and subtitle for export header
- `selectedTool`: Currently active tool from toolbar
- `history` / `historyIndex`: Undo/Redo state management

### Key Components

**App.tsx**
- Central state container
- History management (pushToHistory, handleUndo, handleRedo)
- Export handling with html2canvas
- Responsive layout management (mobile/desktop views)

**GridCanvas.tsx**
- Renders the A4-formatted canvas with whiteboard positioning
- Implements "Smart Corridor Sizing" (auto-resize rows/cols with only corridors)
- CSS Grid-based layout with dynamic template generation
- Add row/column triggers on grid edges

**GridCell.tsx**
- Memoized component for individual grid cells
- Handles cell editing states and name input
- Renders different visual styles based on cell type (student, teacher, corridor)
- Dynamic text sizing based on name length

**Sidebar.tsx** (in components/)
- Settings panel for grid dimensions and class info
- Whiteboard position selector
- Undo/Redo buttons
- Export and Reset actions

**Toolbar.tsx**
- Vertical tool selector on desktop, horizontal on mobile
- Tools: Student, Teacher, Merge, Corridor (V/H), Eraser

### Type Definitions (types.ts)

```typescript
ToolType = 'student' | 'teacher' | 'corridor-horizontal' | 'corridor-vertical' | 'eraser' | 'merge'
BoardPosition = 'top' | 'bottom' | 'left' | 'right' | 'none'

CellData {
  id: string;           // "row-col" format
  row: number;
  col: number;
  type: ToolType;
  name?: string;        // For student cells
  rowSpan?: number;     // For merged cells
  colSpan?: number;     // For merged cells
}
```

### CDN Dependencies

The application loads these dependencies via CDN in `index.html`:
- React 19 & React DOM: via esm.sh
- Tailwind CSS: via cdn.tailwindcss.com
- html2canvas: via cdnjs
- Lucide React: via esm.sh
- Inter font: via Google Fonts

## Development Conventions

### Code Style
- **Components**: Functional components with explicit return types
- **Props**: Destructured with TypeScript interfaces
- **Styling**: Tailwind CSS utility classes
- **Colors**: Zinc (grays) + Emerald (accents) theme
- **Memoization**: GridCell uses `memo()` for performance

### CSS Conventions
- Dark theme base: `bg-zinc-950 text-zinc-100`
- Primary accent: `emerald-600` / `emerald-400`
- Border colors: `zinc-800` for subtle borders
- Rounded corners: `rounded-lg` (8px) standard
- Shadows: `shadow-lg` with emerald/zinc color overlays

### File Organization
- Components in `/components` directory
- Types in `types.ts` at root
- Main app logic in `App.tsx`
- **Important**: `Sidebar.tsx` at root is legacy; active version is in `components/Sidebar.tsx`

## Export Functionality

The export feature uses html2canvas to capture the DOM element with id `petakelas-canvas`:
- Scale factor: 3x for high resolution
- Background: White (#ffffff)
- CORS enabled for image handling
- Filename derived from class name (kebab-case)

## Deployment

Configured for GitHub Pages deployment:
- Base path in `vite.config.ts`: `/petakelas/`
- Update this if deploying to a different repo name
- `gh-pages` package handles deployment to `gh-pages` branch

## Environment Variables

`.env.local` contains:
```
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

**Note**: This appears to be a placeholder and is not actively used in the application code.

## Known Considerations

1. **History Limit**: Undo/Redo history is limited to 50 states (circular buffer behavior)
2. **Grid Limits**: Maximum 20 rows and 20 columns
3. **Mobile View**: Edit tools are hidden in mobile view mode; use "Exit View Mode" to edit
4. **Merge Tool**: Select two diagonal corners to create merged cells
5. **Legacy File**: `Sidebar.tsx` at project root should not be imported; use `components/Sidebar.tsx`

## Testing

No test suite is currently configured. The project relies on manual testing during development.

## Security Notes

- No sensitive data should be committed (`.env.local` is gitignored)
- CDN dependencies are loaded from trusted sources (esm.sh, cdnjs, Google Fonts)
- Export functionality generates client-side downloads only
