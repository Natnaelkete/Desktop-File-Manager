const fs = require('fs').promises;
const path = require('path');

async function testReadDir() {
  const desktopPath = 'C:\\Users\\use\\Desktop';
  console.log(`Testing readdir for: ${desktopPath}`);
  
  try {
    const files = await fs.readdir(desktopPath, { withFileTypes: true });
    console.log(`Found ${files.length} entries:`);
    files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.name} (${file.isDirectory() ? 'DIR' : 'FILE'})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReadDir();
