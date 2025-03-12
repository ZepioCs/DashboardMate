export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed'

export const ChangeTypeColors: Record<ChangeType, { light: string; dark: string }> = {
  added: {
    light: 'border-green-200 bg-green-50 text-green-700',
    dark: 'dark:border-green-800 dark:bg-green-950 dark:text-green-300'
  },
  changed: {
    light: 'border-blue-200 bg-blue-50 text-blue-700',
    dark: 'dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
  },
  fixed: {
    light: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    dark: 'dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
  },
  removed: {
    light: 'border-red-200 bg-red-50 text-red-700',
    dark: 'dark:border-red-800 dark:bg-red-950 dark:text-red-300'
  }
}

export enum AreaType {
  UI = 'UI/UX',
  Settings = 'Settings',
  TaskManagement = 'Task Management',
  DataStorage = 'Data Storage',
  FileSystem = 'File System',
  AutoUpdate = 'Auto Update System',
  Performance = 'Performance',
  Security = 'Security',
  Documentation = 'Documentation'
}

export const AreaTypeColors: Record<AreaType, { light: string; dark: string }> = {
  [AreaType.UI]: {
    light: 'border-purple-200 bg-purple-50 text-purple-700',
    dark: 'dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
  },
  [AreaType.Settings]: {
    light: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    dark: 'dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
  },
  [AreaType.TaskManagement]: {
    light: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    dark: 'dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
  },
  [AreaType.DataStorage]: {
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  },
  [AreaType.FileSystem]: {
    light: 'border-teal-200 bg-teal-50 text-teal-700',
    dark: 'dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300'
  },
  [AreaType.AutoUpdate]: {
    light: 'border-orange-200 bg-orange-50 text-orange-700',
    dark: 'dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
  },
  [AreaType.Performance]: {
    light: 'border-amber-200 bg-amber-50 text-amber-700',
    dark: 'dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
  },
  [AreaType.Security]: {
    light: 'border-rose-200 bg-rose-50 text-rose-700',
    dark: 'dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
  },
  [AreaType.Documentation]: {
    light: 'border-slate-200 bg-slate-50 text-slate-700',
    dark: 'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
  }
}

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  summary: string
  changes: {
    type: ChangeType
    title: string
    description: string
    technical_details?: string
    affected_areas?: AreaType[]
    screenshots?: string[]
  }[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2024-03-19',
    title: 'Major Update: Task Management & UI Overhaul',
    summary:
      'Comprehensive update introducing advanced scheduling, task archiving, enhanced task details, and performance improvements.',
    changes: [
      {
        type: 'added',
        title: 'Advanced Task Scheduling',
        description:
          'Introduced a powerful new scheduling system with drag-and-drop functionality and multiple sorting modes',
        technical_details:
          'Implemented using @dnd-kit/core for drag-and-drop, with support for both priority-based and custom ordering. Added automatic time adjustments within priority groups and manual time adjustment capabilities. Added ability to disabled and enable Sat/Sun columns. Enhanced with visual feedback during drag operations.',
        affected_areas: [AreaType.TaskManagement, AreaType.UI]
      },
      {
        type: 'changed',
        title: 'Schedule UI Overhaul',
        description:
          'Completely redesigned schedule interface with improved visual hierarchy and mobile responsiveness',
        technical_details:
          'Enhanced task cards with priority-based color coding, improved accessibility for drag interactions, and optimized grid layout for both desktop and mobile views. Added toggle between priority and custom sorting modes.',
        affected_areas: [AreaType.UI]
      },
      {
        type: 'added',
        title: 'Task Archiving System',
        description:
          'Introduced an archiving system for completed tasks with both automatic and manual options',
        technical_details:
          'Implemented automatic archiving for tasks completed more than a week ago, added manual archive functionality with confirmation dialog, and created a dedicated archive view for reviewing archived tasks.',
        affected_areas: [AreaType.TaskManagement, AreaType.UI]
      },
      {
        type: 'added',
        title: 'Time Management Features',
        description: 'Added smart time management with automatic and manual time adjustments',
        technical_details:
          'Implemented intelligent time slot management that maintains time order within priority groups while allowing manual overrides. Added visual indicators for drag targets and improved time slot allocation logic.',
        affected_areas: [AreaType.TaskManagement]
      },
      {
        type: 'added',
        title: 'Enhanced Task Details',
        description: 'Added comprehensive task overview with notes, subtasks, and timeline',
        technical_details:
          'Implemented detailed task view dialog showing task description, notes history, subtasks with completion status, and a complete timeline of task events. Added support for tags and improved the visual presentation of task metadata.',
        affected_areas: [AreaType.UI, AreaType.TaskManagement]
      },
      {
        type: 'changed',
        title: 'Performance Optimizations',
        description: 'Improved application performance and responsiveness',
        technical_details:
          'Optimized chart animations by reducing animation duration to 300ms. Enhanced state management for better UI responsiveness. Improved loading times for task lists and analytics views.',
        affected_areas: [AreaType.Performance, AreaType.UI]
      }
    ]
  },
  {
    version: '1.2.0',
    date: '2025-03-10',
    title: 'Advanced Task Management & Search',
    summary: 'This update introduces search and filter ability for tasks.',
    changes: [
      {
        type: 'added',
        title: 'Search & Filter ability',
        description: 'Added search and filter ability for tasks',
        technical_details:
          "Implemented a search and filter system for tasks. The Filter includes status, priority, and tags. The search is a global search that searches for tasks by name, description, and notes. It's search is case insensitive and supports fuzzy matching.",
        affected_areas: [AreaType.TaskManagement, AreaType.UI]
      },
      {
        type: 'added',
        title: 'Task Notes',
        description: 'Added notes to tasks',
        technical_details:
          'Changed note input to use a textarea element with automatic height expansion and custom scroll behavior for better editing experience.',
        affected_areas: [AreaType.TaskManagement]
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2025-03-10',
    title: 'Drag & Drop Sorting',
    summary: 'This update introduces drag & drop sorting for tasks.',
    changes: [
      {
        type: 'fixed',
        title: 'Task Sorting System',
        description: 'Fixed issues with task sorting and ordering in lists',
        technical_details:
          'Implemented @dnd-kit/core and @dnd-kit/sortable for drag and drop functionality. Added DndContext with closestCorners collision detection. Integrated SortableContext with verticalListSortingStrategy for smooth reordering. Implemented task store methods moveTask() and updateTaskOrder() to handle status changes and reordering persistence.',
        affected_areas: [AreaType.TaskManagement, AreaType.UI]
      },
      {
        type: 'fixed',
        title: 'Adjusted Dark Mode Colors for Charts',
        description: 'Improved chart readability in dark mode',
        technical_details:
          'Enhanced Recharts configuration with dynamic color schemes based on theme. Updated chart stroke colors, fill gradients and tooltip styles for better dark mode visibility. Added support for theme-aware grid lines and axis labels.',
        affected_areas: [AreaType.UI, AreaType.TaskManagement]
      }
    ]
  },
  {
    version: '1.0.3',
    date: '2025-03-06',
    title: 'Version Display & Changelog Update',
    summary: 'This update fixes version display issues and introduces a detailed changelog system.',
    changes: [
      {
        type: 'fixed',
        title: 'Version Display Fix',
        description: 'Fixed app version display in settings to correctly show the current version',
        technical_details:
          "Replaced environment variable based version detection with Electron's app.getVersion() method for more reliable version information",
        affected_areas: [AreaType.Settings, AreaType.UI]
      },
      {
        type: 'added',
        title: 'Enhanced Changelog System',
        description: 'Added a comprehensive changelog dialog to track version history',
        technical_details:
          'Implemented using Radix UI components with a collapsible card-based layout and detailed version information',
        affected_areas: [AreaType.UI, AreaType.Documentation]
      }
    ]
  },
  {
    version: '1.0.2',
    date: '2025-03-06',
    title: 'Auto-Update & Error Handling Improvements',
    summary: 'Enhanced auto-update system and improved error handling across the application.',
    changes: [
      {
        type: 'fixed',
        title: 'Auto-Update System Fix',
        description:
          'Fixed auto-update functionality to properly check, download and install updates',
        technical_details:
          'Resolved issues with update progress tracking and improved error handling in the update process',
        affected_areas: [AreaType.AutoUpdate, AreaType.Settings]
      },
      {
        type: 'changed',
        title: 'Enhanced Error Handling',
        description: 'Improved error handling in file operations with better error messages',
        technical_details:
          'Implemented comprehensive error handling for file operations with detailed error messages and logging',
        affected_areas: [AreaType.FileSystem, AreaType.DataStorage]
      }
    ]
  },
  {
    version: '1.0.1',
    date: '2025-03-06',
    title: 'Task Management Enhancements',
    summary: 'Improved task management with sorting fixes and import/export functionality.',
    changes: [
      {
        type: 'fixed',
        title: 'Task Sorting System',
        description: 'Fixed issues with task sorting and ordering in lists',
        technical_details: 'Resolved drag-and-drop sorting issues and improved sort persistence',
        affected_areas: [AreaType.TaskManagement, AreaType.UI]
      },
      {
        type: 'added',
        title: 'Task Import/Export',
        description: 'Added functionality to import and export tasks for backup and transfer',
        technical_details:
          'Implemented JSON-based import/export system with error handling and validation',
        affected_areas: [AreaType.DataStorage, AreaType.FileSystem]
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2025-03-06',
    title: 'Initial Release',
    summary: 'First public release of DashboardMate with core task management features.',
    changes: [
      {
        type: 'added',
        title: 'Core Application',
        description: 'Initial release of DashboardMate',
        technical_details:
          'Built with Electron, React, and TypeScript, featuring a modern UI and efficient task management system',
        affected_areas: [AreaType.UI, AreaType.TaskManagement, AreaType.DataStorage]
      },
      {
        type: 'added',
        title: 'Task Management',
        description:
          'Basic task management functionality including creation, editing, and organization',
        technical_details:
          'Implemented CRUD operations for tasks with local storage persistence and real-time updates',
        affected_areas: [AreaType.TaskManagement, AreaType.DataStorage]
      },
      {
        type: 'added',
        title: 'Theme Support',
        description: 'Dark/Light theme support with system preference detection',
        technical_details:
          'Implemented theme switching using Tailwind CSS with system preference detection and persistence',
        affected_areas: [AreaType.UI, AreaType.Settings]
      }
    ]
  }
]
