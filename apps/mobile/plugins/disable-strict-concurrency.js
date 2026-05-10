const { withDangerousMod } = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

/** Injects SWIFT_STRICT_CONCURRENCY=minimal into the existing post_install block for ExpoModulesCore */
function withDisableStrictConcurrency(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile')
      let contents = fs.readFileSync(podfile, 'utf-8')

      // Only add if not already present
      if (contents.includes('SWIFT_STRICT_CONCURRENCY')) {
        return config
      }

      const snippet = `
    # Fix expo-modules-core Swift strict concurrency errors (Xcode 16+)
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoModulesCore'
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
          config.build_settings['OTHER_SWIFT_FLAGS'] ||= '$(inherited)'
          config.build_settings['OTHER_SWIFT_FLAGS'] += ' -Xfrontend -strict-concurrency=minimal'
        end
      end
    end`

      // Inject into the existing post_install block (right after `post_install do |installer|`)
      const postInstallRegex = /post_install do \|installer\|/
      const match = contents.match(postInstallRegex)
      if (match) {
        const idx = contents.indexOf(match[0]) + match[0].length
        contents = contents.slice(0, idx) + snippet + contents.slice(idx)
      } else {
        // Fallback: if no post_install exists, add one before the final end
        const fullSnippet = `\n  post_install do |installer|${snippet}\n  end\n`
        const lastEnd = contents.lastIndexOf('\nend')
        if (lastEnd !== -1) {
          contents = contents.slice(0, lastEnd) + fullSnippet + contents.slice(lastEnd)
        } else {
          contents += fullSnippet
        }
      }

      fs.writeFileSync(podfile, contents)
      return config
    },
  ])
}

module.exports = withDisableStrictConcurrency
