# Petakelas - Student Seating Plan Maker

Petakelas is a modern, dark-themed web application designed to help teachers create, visualize, and export classroom seating plans. Built with React and Tailwind CSS, it features a responsive grid editor with "vibecoding" aesthetics (Zinc & Emerald theme).

## Features

### 🎨 Visual Editor
- **Interactive Grid**: Click to place students, teacher desks, or structural elements.
- **Tools**:
  - 👤 **Student**: Place student desks. Click again to edit names.
  - 📺 **Teacher**: Place the teacher's desk.
  - ⚄ **Merge**: Create larger areas (e.g., lab tables or group desks) by merging cells.
  - ↕️ **Corridors**: Add vertical or horizontal walking spaces.
  - 🧼 **Eraser**: Remove items from the grid.
- **Smart Sizing**: "Auto Resize" mode automatically shrinks rows/columns that only contain corridors to maximize space for desks.

### ⚙️ Customization
- **Grid Dimensions**: Adjustable rows (up to 20) and columns (up to 20).
- **Whiteboard Position**: Place the whiteboard at the Top, Bottom, Left, or Right of the room.
- **Class Details**: Custom class name and subtitle (e.g., "Year 10 Physics - Room 402").
- **A4 Optimization**: The canvas maintains an aspect ratio close to A4/Letter paper for easy printing.

### 💾 Functionality
- **High-Res Export**: Download the plan as a high-quality PNG image using `html2canvas`.
- **History**: Full Undo/Redo support for all actions.
- **Responsive**: Works on desktop and has a view-only mode for mobile devices.

## Tech Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Export**: html2canvas
- **Build Tooling**: ES Modules (via `importmap` in `index.html`)

## Usage

1. **Setup Grid**: Use the sidebar to set the number of rows and columns.
2. **Add Layout**: Select the **Corridor** or **Teacher** tool to define the room structure.
3. **Place Students**: Select the **Student** tool and click cells.
4. **Edit Names**: Click on a placed student desk to type a name. Press Enter or click away to save.
5. **Merge Cells**: Use the **Merge** tool to click two diagonal points to create a large desk.
6. **Export**: Click "Export High-Res PNG" in the sidebar to download your plan.

## Development

The project uses a simple structure without a complex bundler, relying on native ES modules and CDN imports for rapid prototyping.

- `index.html`: Entry point and import maps.
- `index.tsx`: React root.
- `App.tsx`: Main application state and layout.
- `components/`: UI components (GridCanvas, Sidebar, Toolbar).
- `types.ts`: TypeScript definitions.

## License

MIT
