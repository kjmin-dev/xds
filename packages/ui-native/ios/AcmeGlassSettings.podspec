Pod::Spec.new do |s|
  s.name = 'AcmeGlassSettings'
  s.version = '0.1.0'
  s.summary = 'Accessibility and power settings for glass surfaces.'
  s.license = 'MIT'
  s.author = 'Acme'
  s.homepage = 'https://example.com/acme'
  s.source = { :git => s.homepage }
  s.platform = :ios, '16.4'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
end
