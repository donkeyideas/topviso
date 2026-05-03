const { withDangerousMod } = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

/** Appends a post_install snippet that sets SWIFT_STRICT_CONCURRENCY=minimal for ExpoModulesCore */
function withDisableStrictConcurrency(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile')
      let contents = fs.readFileSync(podfile, 'utf-8')

      const snippet = `
  # Fix expo-modules-core Swift strict concurrency errors (Xcode 16+)
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoModulesCore'
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
          config.build_settings['OTHER_SWIFT_FLAGS'] ||= '$(inherited)'
          config.build_settings['OTHER_SWIFT_FLAGS'] += ' -Xfrontend -strict-concurrency=minimal'
        end
      end
    end
  end`

      // Only add if not already present
      if (!contents.includes('SWIFT_STRICT_CONCURRENCY')) {
        // Insert before the final 'end' of the Podfile (closing the target block)
        const lastEnd = contents.lastIndexOf('\nend')
        if (lastEnd !== -1) {
          contents = contents.slice(0, lastEnd) + snippet + contents.slice(lastEnd)
        } else {
          contents += snippet
        }
        fs.writeFileSync(podfile, contents)
      }

      return config
    },
  ])
}

module.exports = withDisableStrictConcurrency
