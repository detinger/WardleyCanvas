# Wardley Canvas

Wardley Canvas is an interactive web application designed for creating, visualizing, and analyzing Wardley Maps. This tool provides an intuitive drag-and-drop interface to help you map out your value chains, understand your strategic landscape, and make better decisions.

Built with Next.js, React, TypeScript, and ShadCN UI, this application is a modern, performant, and extendable platform for strategic mapping.

## Features

- **Interactive Canvas**: Easily drag components onto the map to build your value chain.
- **Visual Editor**: Position components along the evolution axis (Genesis, Custom-built, Product, Commodity) and the value chain axis (Visible to Invisible).
- **Dependency Linking**: Create links between components to visualize dependencies.
- **Node Management**: Double-click to rename components on the fly.
- **Local Persistence**: Save your maps to your browser's local storage and load them later.
- **Pre-built Templates**: Get started quickly with a gallery of common Wardley Map templates.
- **In-App Guide**: Learn the core concepts of Wardley Mapping without leaving the app.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Library**: [React](https://react.dev/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Drag and Drop**: [Dnd-kit](https://dndkit.com/)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository:**
    If you don't have the project files, first clone the repository to your local machine.
    ```bash
    # Replace with your repository's URL
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    Use `npm` to install the required packages from `package.json`.
    ```bash
    npm install
    ```

### Running the Application

1.  **Start the development server:**
    This command starts the Next.js development server.
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Genkit AI Development (Optional):**
    If you are working on AI features, you can run the Genkit development server in a separate terminal. This provides a UI for testing and monitoring your Genkit flows.
    ```bash
    npm run genkit:dev
    ```

## How to Use

- **Add a component**: Drag the "New Component" block from the right-hand toolbox onto the canvas.
- **Move a component**: Click and drag any component on the canvas. Its evolution stage will update automatically based on its position.
- **Rename a component**: Double-click on a component's text label to edit its name.
- **Create a link**: Click on one component to select it, then click on another to create a dependency link between them.
- **Save/Load**: Use the header buttons to save your current map or load a previously saved one.
- **Templates**: Explore the "Templates" dialog to start from a pre-configured map.
