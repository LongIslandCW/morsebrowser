const fs = require('fs');
const path = require('path');

const directoryPath = './src/presets/configs'; // Update this with the path to your directory

// Function to update the JSON files
function updateJSONFiles() {
  // Read all files in the directory
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    // Iterate through each file in the directory
    files.forEach(file => {
      if (path.extname(file) === '.json') {
        // Read the content of the JSON file
        const filePath = path.join(directoryPath, file);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(`Error reading file ${file}:`, err);
            return;
          }

          try {
            // Parse the JSON data
            const jsonData = JSON.parse(data);

            // Access the "morseSettings" array and add new objects
            if (jsonData.morseSettings && Array.isArray(jsonData.morseSettings)) {
              jsonData.morseSettings.push(
                { key: 'speakFirst', value: false, comment: null },
                { key: 'speakFirstRepeats', value: 0, comment: null },
                { key: 'speakFirstAdditionalWordspaces', value: 0, comment: null }
              );

              // Convert the updated JSON back to a string
              const updatedJson = JSON.stringify(jsonData, null, 2);

              // Write the updated JSON back to the file
              fs.writeFile(filePath, updatedJson, 'utf8', (err) => {
                if (err) {
                  console.error(`Error writing file ${file}:`, err);
                } else {
                  console.log(`File ${file} updated successfully.`);
                }
              });
            } else {
              console.warn(`File ${file} does not contain the expected "morseSettings" array.`);
            }
          } catch (parseError) {
            console.error(`Error parsing JSON in file ${file}:`, parseError);
          }
        });
      }
    });
  });
}

// Call the function to update JSON files
updateJSONFiles();
