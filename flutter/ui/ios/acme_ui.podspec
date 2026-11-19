Pod::Spec.new do |s|
  s.name = 'acme_ui'
  s.version = '0.1.0'
  s.summary = 'Acme touch components and adaptive glass surfaces.'
  s.homepage = 'https://example.com/acme'
  s.license = 'MIT'
  s.author = 'Acme'
  s.source = { :path => '.' }
  s.source_files = 'acme_ui/Sources/acme_ui/*.swift'
  s.dependency 'Flutter'
  s.platform = :ios, '15.0'
  s.swift_version = '5.0'
end
