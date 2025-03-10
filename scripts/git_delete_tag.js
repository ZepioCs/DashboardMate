#!/usr/bin/env node

const { execSync } = require('child_process')
const version = process.argv[2]

if (!version) {
  console.error('❌ Please provide a version number as argument (e.g. 1.0.0)')
  process.exit(1)
}

try {
  // Delete local tag
  console.log(`🗑️  Deleting local tag v${version}...`)
  execSync(`git tag -d v${version}`)

  // Delete remote tag
  console.log(`🌐 Deleting remote tag v${version}...`)
  execSync(`git push origin :refs/tags/v${version}`)

  console.log('✅ Tag deletion completed successfully!')
} catch (error) {
  console.error('❌ Error occurred:', error.message)
  process.exit(1)
}
