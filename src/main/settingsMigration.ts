import { Settings, SettingsVersion } from '../global_model'
import log from 'electron-log'
import { app } from 'electron'

export const CURRENT_SETTINGS_VERSION = '1.3.0'
export const INITIAL_VERSION = '1.2.0'
export const APP_VERSION = app.getVersion()

interface Migration {
  version: string
  migrate: (settings: Settings) => Settings
}

// Registry of all migrations
const migrations: Migration[] = [
  {
    version: '1.3.0',
    migrate: (settings: Settings): Settings => ({
      ...settings,
      version: '1.3.0',
      notifications: {
        push: settings.notifications?.push ?? false,
        email: settings.notifications?.email ?? false
      },
      ai: {
        autoCreate: settings.ai?.autoCreate ?? false
      },
      schedule: {
        showWeekends: settings.schedule?.showWeekends ?? true
      }
    })
  }

  // Example migration that removes old properties and adds new ones
  // {
  //   version: '1.4.0',
  //   migrate: (settings: Settings): Settings => {
  //     // Create new settings object without the properties we want to remove
  //     const {
  //       notifications: { email, ...notificationSettings },  // Remove email notifications
  //       ai,                                                // Keep ai settings
  //       schedule,                                          // Keep schedule settings
  //       ...restSettings                                    // Keep other root settings
  //     } = settings
  //
  //     // Return new settings object with removed properties and new ones
  //     return {
  //       ...restSettings,                    // Base settings
  //       version: '1.4.0',                   // New version
  //       notifications: {
  //         ...notificationSettings,          // Keep other notification settings
  //         desktop: true,                    // Add new notification type
  //         sound: true                       // Add another new setting
  //       },
  //       ai,                                // Keep ai settings unchanged
  //       schedule,                          // Keep schedule settings unchanged
  //       theme: {                           // Add completely new feature
  //         mode: 'system',
  //         accent: 'blue'
  //       }
  //     }
  //   }
  // },
  //
  // Example of a more complex migration with data transformation
  // {
  //   version: '1.5.0',
  //   migrate: (settings: Settings): Settings => {
  //     // Example: Converting a simple boolean to an object with more options
  //     const { ai: { autoCreate, ...restAi }, ...restSettings } = settings
  //
  //     return {
  //       ...restSettings,
  //       version: '1.5.0',
  //       ai: {
  //         ...restAi,
  //         automation: {                    // Transform old boolean into detailed config
  //           enabled: autoCreate ?? false,  // Use old autoCreate as default
  //           frequency: 'daily',           // Add new sub-settings
  //           maxItems: 5
  //         }
  //       }
  //     }
  //   }
  // }
]

function validateMigrations(): void {
  for (let i = 1; i < migrations.length; i++) {
    if (compareVersions(migrations[i].version, migrations[i - 1].version) <= 0) {
      throw new Error(
        `Migrations must be in ascending order. Found ${migrations[i - 1].version} followed by ${migrations[i].version}`
      )
    }
  }

  if (migrations.length > 0 && compareVersions(migrations[0].version, INITIAL_VERSION) <= 0) {
    throw new Error(
      `First migration version (${migrations[0].version}) must be greater than INITIAL_VERSION (${INITIAL_VERSION})`
    )
  }

  const latestMigration = migrations[migrations.length - 1]
  if (latestMigration && latestMigration.version !== CURRENT_SETTINGS_VERSION) {
    throw new Error(
      `CURRENT_SETTINGS_VERSION (${CURRENT_SETTINGS_VERSION}) must match latest migration version (${latestMigration.version})`
    )
  }

  for (const migration of migrations) {
    if (compareVersions(migration.version, APP_VERSION) > 0) {
      throw new Error(
        `Migration version ${migration.version} is higher than current app version ${APP_VERSION}. This could cause compatibility issues.`
      )
    }
  }
}

validateMigrations()

export function parseVersion(version: string): SettingsVersion {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number)
  return { major, minor, patch }
}

export function compareVersions(v1: string, v2: string): number {
  const ver1 = parseVersion(v1)
  const ver2 = parseVersion(v2)

  if (ver1.major !== ver2.major) return ver1.major - ver2.major
  if (ver1.minor !== ver2.minor) return ver1.minor - ver2.minor
  return ver1.patch - ver2.patch
}

function getMigrationsToApply(currentVersion: string): Migration[] {
  return migrations
    .filter(
      (migration) =>
        compareVersions(migration.version, currentVersion) > 0 &&
        compareVersions(migration.version, APP_VERSION) <= 0
    )
    .sort((a, b) => compareVersions(a.version, b.version))
}

export function migrateSettings(settings: Settings): Settings {
  if (!settings.version) {
    settings.version = INITIAL_VERSION
  }

  try {
    const migrationsToApply = getMigrationsToApply(settings.version)

    if (migrationsToApply.length > 0) {
      if (compareVersions(settings.version, APP_VERSION) > 0) {
        log.warn(
          `Settings version (${settings.version}) is newer than app version (${APP_VERSION}). Some features may not work correctly.`
        )
        return settings
      }

      log.info(
        `Migrating settings from ${settings.version} through versions: ${migrationsToApply
          .map((m) => m.version)
          .join(', ')}`
      )

      settings = migrationsToApply.reduce((currentSettings, migration) => {
        log.info(`Applying migration to version ${migration.version}`)
        return migration.migrate(currentSettings)
      }, settings)

      log.info('Settings migration completed successfully')
    }

    return settings
  } catch (error) {
    log.error('Failed to migrate settings:', error)
    throw error
  }
}
