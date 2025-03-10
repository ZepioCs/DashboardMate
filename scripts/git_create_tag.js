#!/usr/bin/env node

const { execSync } = require('child_process')
const version = process.argv[2]

if (!version) {
  console.error('❌ Please provide a version number as argument (e.g. 1.0.0)')
  process.exit(1)
}

try {
  // Create new tag
  console.log(`🏷️  Creating tag v${version}...`)
  execSync(`git tag v${version}`)

  // Push new tag
  console.log(`🚀 Pushing tag v${version}...`)
  execSync(`git push origin v${version}`)

  console.log('✅ Tag creation completed successfully!')
} catch (error) {
  console.error('❌ Error occurred:', error.message)
  process.exit(1)
}
