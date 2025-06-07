const fs = require('fs');
const path = require('path');

// Directory containing the service files
const apiDir = path.join(__dirname, 'projects', 'digby-swagger-client', 'api');

// Read all files in the directory
fs.readdir(apiDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Process each file
  files.forEach(file => {
    // Only process service files
    if (file.endsWith('.service.ts')) {
      const filePath = path.join(apiDir, file);

      // Read file content
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        // Replace RxJS import
        const updatedContent = data.replace(
          "import { Observable } from 'rxjs/Observable';",
          "import { Observable } from 'rxjs';"
        );

        // Write the updated content back to the file
        fs.writeFile(filePath, updatedContent, 'utf8', err => {
          if (err) {
            console.error(`Error writing file ${file}:`, err);
            return;
          }
          console.log(`Successfully updated ${file}`);
        });
      });
    }
  });
});
