import regedit from 'regedit'

const keys = [
  'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
]

console.log('Testing regedit data structure...')
regedit.list(keys, async (err, results) => {
  if (err) {
    console.error('Scan Error:', err)
    process.exit(1)
  }
  
  const subkey = results[keys[0]].keys[0]
  const fullPath = `${keys[0]}\\${subkey}`
  
  regedit.list([fullPath], (err2, details) => {
    if (err2) {
      console.error('Subkey Error:', err2)
      process.exit(1)
    }
    
    console.log('Value structure for:', fullPath)
    console.log(JSON.stringify(details[fullPath].values, null, 2))
    process.exit(0)
  })
})
